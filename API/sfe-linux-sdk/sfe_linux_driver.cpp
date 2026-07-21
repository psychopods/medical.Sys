#include "sfe_linux_driver.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <cstring>
#include <cstdlib>
#include <vector>
#include <chrono>
#include <thread>

#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <scsi/sg.h>

SfeLinuxDriver::SfeLinuxDriver() : m_fd(-1), m_sensorType(4), m_brightness(0) {}

SfeLinuxDriver::~SfeLinuxDriver() {
    closeDevice();
}

void SfeLinuxDriver::closeDevice() {
    if (m_fd >= 0) {
        ::close(m_fd);
        m_fd = -1;
    }
    m_devicePath = "";
}

bool SfeLinuxDriver::sendScsiCmd(const unsigned char* cdb, int cdbLen, unsigned char* data, int dataLen, bool isWrite) {
    if (m_fd < 0) return false;

    sg_io_hdr_t io_hdr;
    memset(&io_hdr, 0, sizeof(sg_io_hdr_t));

    unsigned char sense_b[32];
    memset(sense_b, 0, sizeof(sense_b));

    io_hdr.interface_id = 'S';
    io_hdr.cmd_len = cdbLen;
    io_hdr.mx_sb_len = sizeof(sense_b);
    io_hdr.dxfer_direction = isWrite ? SG_DXFER_TO_DEV : SG_DXFER_FROM_DEV;
    io_hdr.dxfer_len = dataLen;
    io_hdr.dxferp = data;
    io_hdr.cmdp = (unsigned char*)cdb;
    io_hdr.sbp = sense_b;
    io_hdr.timeout = 20000;

    if (ioctl(m_fd, SG_IO, &io_hdr) < 0) {
        return false;
    }

    return (io_hdr.status == 0 && io_hdr.host_status == 0 && io_hdr.driver_status == 0);
}

bool SfeLinuxDriver::findAndOpenDevice() {
    closeDevice();

    for (int i = 0; i <= 15; i++) {
        std::string devPath = "/dev/sg" + std::to_string(i);
        int fd = ::open(devPath.c_str(), O_RDWR);
        if (fd < 0) continue;

        m_fd = fd;

        // Inquiry Command: 12 00 00 00 60 00
        unsigned char cdb[6] = { 0x12, 0x00, 0x00, 0x00, 0x60, 0x00 };
        unsigned char inqBuf[96];
        memset(inqBuf, 0, sizeof(inqBuf));

        if (sendScsiCmd(cdb, sizeof(cdb), inqBuf, sizeof(inqBuf), false)) {
            std::string vendorProduct((char*)inqBuf, sizeof(inqBuf));
            if (vendorProduct.find("Finger") != std::string::npos || vendorProduct.find("Module") != std::string::npos) {
                m_devicePath = devPath;
                std::cout << "[SFE Linux Driver] Auto-detected Finger Module hardware at: " << devPath << std::endl;
                return true;
            }
        }

        ::close(fd);
        m_fd = -1;
    }

    std::cerr << "[SFE Linux Driver] No Finger Module USB device found on /dev/sg*" << std::endl;
    return false;
}

int SfeLinuxDriver::openSensor(int sensorType, int brightness) {
    if (m_fd < 0 && !findAndOpenDevice()) {
        return -100;
    }

    m_sensorType = sensorType;
    m_brightness = brightness;

    // Send SB1001U Open Init SCSI sequence: EF FE 00 00 60 00 00 00 00 00
    unsigned char cdbOut[10] = { 0xef, 0xfe, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char cryptPayload[26] = {
        0xe2, 0x7f, 0xc8, 0x9f, 0x45, 0xd5, 0xc9, 0x9e,
        0x45, 0xd5, 0xc9, 0x9e, 0x45, 0xd5, 0xc9, 0x9e,
        0x45, 0xd5, 0xc9, 0x9e, 0x45, 0xd5, 0xc9, 0x9e, 0x44, 0xd4
    };

    if (!sendScsiCmd(cdbOut, sizeof(cdbOut), cryptPayload, sizeof(cryptPayload), true)) {
        return -100;
    }

    // Read response packet: EF FF 00 00 60 00 00 00 00 00
    unsigned char cdbIn[10] = { 0xef, 0xff, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char respBuf[26];
    memset(respBuf, 0, sizeof(respBuf));

    if (!sendScsiCmd(cdbIn, sizeof(cdbIn), respBuf, sizeof(respBuf), false)) {
        return -100;
    }

    return 0;
}

int SfeLinuxDriver::adjustSensor() {
    if (m_fd < 0) return -100;
    unsigned char cdbOut[10] = { 0xef, 0xfe, 0x3c, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char payload[26];
    memset(payload, 0, sizeof(payload));
    payload[0] = 60; // FP_SEN_ADJUST

    sendScsiCmd(cdbOut, sizeof(cdbOut), payload, sizeof(payload), true);
    return 0;
}

int SfeLinuxDriver::captureFrame() {
    if (m_fd < 0) return -100;
    unsigned char cdbOut[10] = { 0xef, 0xfe, 0x3d, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char payload[26];
    memset(payload, 0, sizeof(payload));
    payload[0] = 61; // FP_SEN_CAPTURE

    if (!sendScsiCmd(cdbOut, sizeof(cdbOut), payload, sizeof(payload), true)) {
        return -100;
    }

    unsigned char cdbIn[10] = { 0xef, 0xff, 0x3d, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char resp[26];
    memset(resp, 0, sizeof(resp));

    if (sendScsiCmd(cdbIn, sizeof(cdbIn), resp, sizeof(resp), false)) {
        return (int)resp[0];
    }

    return 0;
}

int SfeLinuxDriver::isFingerPlaced() {
    if (m_fd < 0) return -100;
    unsigned char cdbOut[10] = { 0xef, 0xfe, 0x3e, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char payload[26];
    memset(payload, 0, sizeof(payload));
    payload[0] = 62; // FP_SEN_ISFINGER

    sendScsiCmd(cdbOut, sizeof(cdbOut), payload, sizeof(payload), true);

    unsigned char cdbIn[10] = { 0xef, 0xff, 0x3e, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char resp[26];
    memset(resp, 0, sizeof(resp));

    if (sendScsiCmd(cdbIn, sizeof(cdbIn), resp, sizeof(resp), false)) {
        return (int)resp[0];
    }

    return 0;
}

bool SfeLinuxDriver::getFeatureTemplate(std::vector<unsigned char>& outTemplate) {
    if (m_fd < 0) return false;

    outTemplate.assign(FEATURE_SIZE, 0);

    unsigned char cdbOut[10] = { 0xef, 0xfe, 0x40, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    unsigned char payload[26];
    memset(payload, 0, sizeof(payload));
    payload[0] = 64; // FP_SEN_GETFEATURE

    sendScsiCmd(cdbOut, sizeof(cdbOut), payload, sizeof(payload), true);

    unsigned char cdbIn[10] = { 0xef, 0xff, 0x40, 0x00, 0x60, 0x00, 0x00, 0x00, 0x00, 0x00 };
    sendScsiCmd(cdbIn, sizeof(cdbIn), outTemplate.data(), outTemplate.size(), false);

    int nonZero = 0;
    for (unsigned char b : outTemplate) {
        if (b != 0) nonZero++;
    }

    return nonZero > 0;
}
