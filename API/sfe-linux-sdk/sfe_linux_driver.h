#ifndef SFE_LINUX_DRIVER_H
#define SFE_LINUX_DRIVER_H

#include <string>
#include <vector>

#define SENSOR_EB6048                       4
#define SENSOR_GC0307                       5
#define SENSOR_EB6048_20                    6
#define FEATURE_SIZE                        1404

class SfeLinuxDriver {
public:
    SfeLinuxDriver();
    ~SfeLinuxDriver();

    bool findAndOpenDevice();
    void closeDevice();

    int openSensor(int sensorType, int brightness);
    int adjustSensor();
    int captureFrame();
    int isFingerPlaced();
    bool getFeatureTemplate(std::vector<unsigned char>& outTemplate);

    std::string getActiveDevicePath() const { return m_devicePath; }
    bool isConnected() const { return m_fd >= 0; }

private:
    int m_fd;
    std::string m_devicePath;
    int m_sensorType;
    int m_brightness;

    bool sendScsiCmd(const unsigned char* cdb, int cdbLen, unsigned char* data, int dataLen, bool isWrite);
};

#endif // SFE_LINUX_DRIVER_H
