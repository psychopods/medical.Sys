using System;
using System.Drawing;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using System.Runtime.InteropServices;

namespace SfeWindowsProxy
{
    class Program
    {
        private static int port = 5000;
        private static HttpListener listener;
        private static NotifyIcon trayIcon;
        private static ContextMenu trayMenu;

        // Constants from SFE.h
        private const int SENSOR_EB6048 = 4;
        private const int SENSOR_GC0307 = 5;
        private const int SENSOR_EB6048_20 = 6;

        private const int FP_OPEN = 1;
        private const int FP_CLOSE = 2;
        private const int FP_SETFPDATA = 11;
        private const int FP_VERIFYFPDATA = 44;

        private const int FEATURE_SIZE = 1404;

        // ----------------------------------------------------------------------------------
        // DllImports for SFEMediator
        // ----------------------------------------------------------------------------------
        [DllImport("SFEMediator.dll", EntryPoint = "sfem_Open", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem32_Open([MarshalAs(UnmanagedType.LPWStr)]string strDBFileName, int nSensorType, int nSensorBrAdjust);
        
        [DllImport("SFEMediator64.dll", EntryPoint = "sfem_Open", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem64_Open([MarshalAs(UnmanagedType.LPWStr)]string strDBFileName, int nSensorType, int nSensorBrAdjust);

        [DllImport("SFEMediator.dll", EntryPoint = "sfem_Close", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem32_Close();

        [DllImport("SFEMediator64.dll", EntryPoint = "sfem_Close", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem64_Close();

        [DllImport("SFEMediator.dll", EntryPoint = "sfem_IsFinger", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem32_IsFinger();

        [DllImport("SFEMediator64.dll", EntryPoint = "sfem_IsFinger", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem64_IsFinger();

        [DllImport("SFEMediator.dll", EntryPoint = "sfem_Capture", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem32_Capture();

        [DllImport("SFEMediator64.dll", EntryPoint = "sfem_Capture", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem64_Capture();

        [DllImport("SFEMediator.dll", EntryPoint = "sfem_TemplateGetFromImage", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem32_TemplateGetFromImage([MarshalAs(UnmanagedType.LPArray)] byte[] pTemplate);

        [DllImport("SFEMediator64.dll", EntryPoint = "sfem_TemplateGetFromImage", CallingConvention = CallingConvention.Cdecl)]
        private static extern int sfem64_TemplateGetFromImage([MarshalAs(UnmanagedType.LPArray)] byte[] pTemplate);

        // ----------------------------------------------------------------------------------
        // DllImports for SFE
        // ----------------------------------------------------------------------------------
        [DllImport("SFE.dll", EntryPoint = "fp", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr fp32(IntPtr FuncNo, IntPtr Param1, IntPtr Param2, IntPtr Param3);

        [DllImport("SFE64.dll", EntryPoint = "fp", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr fp64(IntPtr FuncNo, IntPtr Param1, IntPtr Param2, IntPtr Param3);

        private static int SfemOpen(string dbFile, int sensorType, int brAdjust)
        {
            return Environment.Is64BitProcess ? sfem64_Open(dbFile, sensorType, brAdjust) : sfem32_Open(dbFile, sensorType, brAdjust);
        }

        private static int SfemClose()
        {
            return Environment.Is64BitProcess ? sfem64_Close() : sfem32_Close();
        }

        private static int SfemIsFinger()
        {
            return Environment.Is64BitProcess ? sfem64_IsFinger() : sfem32_IsFinger();
        }

        private static int SfemCapture()
        {
            return Environment.Is64BitProcess ? sfem64_Capture() : sfem32_Capture();
        }

        private static int SfemTemplateGetFromImage(byte[] template)
        {
            return Environment.Is64BitProcess ? sfem64_TemplateGetFromImage(template) : sfem32_TemplateGetFromImage(template);
        }

        private static IntPtr SfeFp(int funcNo, IntPtr param1, IntPtr param2, IntPtr param3)
        {
            return Environment.Is64BitProcess ? fp64((IntPtr)funcNo, param1, param2, param3) : fp32((IntPtr)funcNo, param1, param2, param3);
        }

        private static IntPtr SfeFp(int funcNo, byte[] param1Bytes, IntPtr param2, IntPtr param3)
        {
            GCHandle handle = GCHandle.Alloc(param1Bytes, GCHandleType.Pinned);
            try
            {
                IntPtr param1Ptr = handle.AddrOfPinnedObject();
                return SfeFp(funcNo, param1Ptr, param2, param3);
            }
            finally
            {
                handle.Free();
            }
        }

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            int customPort = 0;
            if (args.Length > 0 && int.TryParse(args[0], out customPort))
            {
                port = customPort;
            }

            // Create System Tray Context Menu
            trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("SFE Biometric Proxy (Active)", (s, e) => { }).Enabled = false;
            trayMenu.MenuItems.Add("-");
            trayMenu.MenuItems.Add("Check Status", OnCheckStatus);
            trayMenu.MenuItems.Add("Exit Server", OnExit);

            // Create System Tray Icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "SFE Biometric Proxy Server";
            trayIcon.Icon = SystemIcons.Shield;
            trayIcon.ContextMenu = trayMenu;
            trayIcon.Visible = true;

            // Start HTTP Server
            listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:" + port + "/");

            try
            {
                listener.Start();
                trayIcon.ShowBalloonTip(3000, "SFE Biometric Proxy", "Server is running silently in background on http://localhost:" + port + "/", ToolTipIcon.Info);
            }
            catch (HttpListenerException ex)
            {
                string msg = "Port " + port + " conflict or permission error: " + ex.Message;
                trayIcon.ShowBalloonTip(5000, "SFE Proxy Startup Error", msg, ToolTipIcon.Error);
                MessageBox.Show(msg + "\n\nPlease check if port " + port + " is already in use by another app.", "SFE Proxy Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                trayIcon.Visible = false;
                return;
            }
            catch (Exception ex)
            {
                string msg = "Startup Error: " + ex.Message;
                trayIcon.ShowBalloonTip(5000, "SFE Proxy Startup Error", msg, ToolTipIcon.Error);
                trayIcon.Visible = false;
                return;
            }

            // Accept Requests Loop
            ThreadPool.QueueUserWorkItem((state) =>
            {
                while (listener.IsListening)
                {
                    try
                    {
                        HttpListenerContext context = listener.GetContext();
                        ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                    }
                    catch
                    {
                        break;
                    }
                }
            });

            // Run Windows Forms loop (keeps app alive in tray)
            Application.Run();
        }

        private static void OnCheckStatus(object sender, EventArgs e)
        {
            bool running = listener != null && listener.IsListening;
            string statusMsg = running ? "SFE Biometric Proxy Server is active and listening on http://localhost:" + port + "/" : "Server is currently stopped.";
            MessageBox.Show(statusMsg, "SFE Proxy Status", MessageBoxButtons.OK, running ? MessageBoxIcon.Information : MessageBoxIcon.Warning);
        }

        private static void OnExit(object sender, EventArgs e)
        {
            if (MessageBox.Show("Are you sure you want to stop the SFE Biometric Proxy Server?", "Exit SFE Proxy", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                try
                {
                    if (listener != null)
                    {
                        listener.Stop();
                        listener.Close();
                    }
                }
                catch { }

                trayIcon.Visible = false;
                Application.Exit();
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            response.AddHeader("Access-Control-Allow-Origin", "*");
            response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
            response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.ContentType = "application/json";

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = (int)HttpStatusCode.OK;
                response.Close();
                return;
            }

            string path = request.Url.AbsolutePath.ToLower();
            string jsonResponse = "{\"success\":false,\"error\":\"Not Found\"}";

            try
            {
                if (path == "/" || path == "/status")
                {
                    jsonResponse = "{\"success\":true,\"status\":\"running\",\"details\":\"SFE Biometric Proxy Server\"}";
                }
                else if (path == "/capture")
                {
                    jsonResponse = HandleCaptureRequest(request);
                }
                else if (path == "/verify")
                {
                    jsonResponse = HandleVerifyRequest(request);
                }
                else
                {
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                string cleanMsg = ex.Message.Replace("\"", "\\\"");
                jsonResponse = "{\"success\":false,\"error\":\"Internal Server Error: " + cleanMsg + "\"}";
            }

            byte[] buffer = Encoding.UTF8.GetBytes(jsonResponse);
            response.ContentLength64 = buffer.Length;
            try
            {
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch { }
        }

        private static string HandleCaptureRequest(HttpListenerRequest request)
        {
            int sensorType = SENSOR_EB6048;
            int parsedSensor = 0;
            string sensorParam = request.QueryString["sensorType"];
            if (!string.IsNullOrEmpty(sensorParam) && int.TryParse(sensorParam, out parsedSensor))
            {
                sensorType = parsedSensor;
            }

            int openRet = SfemOpen("temp.db", sensorType, 0);
            
            // If default sensor (4) failed, auto-probe all known sensor models (0..8)
            if (openRet < 0)
            {
                int[] probeSensors = new int[] { 0, 1, 2, 3, 5, 6, 7, 8 };
                for (int i = 0; i < probeSensors.Length; i++)
                {
                    int st = probeSensors[i];
                    int tryRet = SfemOpen("temp.db", st, 0);
                    if (tryRet >= 0)
                    {
                        openRet = tryRet;
                        sensorType = st;
                        break;
                    }
                }
            }

            // Fallback: Low-level SFE.dll fp(FP_OPEN)
            if (openRet < 0)
            {
                IntPtr fpOpenRet = SfeFp(FP_OPEN, (IntPtr)sensorType, IntPtr.Zero, IntPtr.Zero);
                if (fpOpenRet.ToInt64() >= 0)
                {
                    openRet = (int)fpOpenRet.ToInt64();
                }
            }

            if (openRet < 0)
            {
                string diagMsg = "Biometric reader USB device not found (Code -100). Please check that your Smackbio USB Fingerprint Scanner is plugged into a USB port on this laptop.";
                trayIcon.ShowBalloonTip(4000, "Scanner Not Found", diagMsg, ToolTipIcon.Warning);
                return "{\"success\":false,\"error\":\"Biometric reader USB device not found (Code -100). Please verify your USB fingerprint scanner is securely plugged in.\"}";
            }


            try
            {
                trayIcon.ShowBalloonTip(2000, "Fingerprint Scanner", "Please place finger on sensor...", ToolTipIcon.Info);

                DateTime startTime = DateTime.Now;
                bool fingerDetected = false;

                while ((DateTime.Now - startTime).TotalSeconds < 10.0)
                {
                    int isFinger = SfemIsFinger();
                    if (isFinger < 0)
                    {
                        SfemClose();
                        return "{\"success\":false,\"error\":\"Sensor read error (code: " + isFinger + ")\"}";
                    }

                    if (isFinger > 0)
                    {
                        fingerDetected = true;
                        break;
                    }

                    Thread.Sleep(100);
                }

                if (!fingerDetected)
                {
                    trayIcon.ShowBalloonTip(3000, "Scanner Timeout", "No finger placed on sensor", ToolTipIcon.Warning);
                    SfemClose();
                    return "{\"success\":false,\"error\":\"Timeout waiting for finger placement\"}";
                }

                int capRet = SfemCapture();
                if (capRet < 0)
                {
                    SfemClose();
                    return "{\"success\":false,\"error\":\"Failed to capture image (code: " + capRet + ")\"}";
                }

                byte[] template = new byte[FEATURE_SIZE];
                int extRet = SfemTemplateGetFromImage(template);
                if (extRet < 0)
                {
                    SfemClose();
                    return "{\"success\":false,\"error\":\"Failed to extract template (code: " + extRet + ")\"}";
                }

                trayIcon.ShowBalloonTip(2000, "Fingerprint Scanner", "Fingerprint captured successfully!", ToolTipIcon.Info);
                string base64Template = Convert.ToBase64String(template);
                SfemClose();

                return "{\"success\":true,\"template\":\"" + base64Template + "\"}";
            }
            catch (Exception ex)
            {
                SfemClose();
                string cleanMsg = ex.Message.Replace("\"", "\\\"");
                return "{\"success\":false,\"error\":\"Capture Exception: " + cleanMsg + "\"}";
            }
        }

        private static string HandleVerifyRequest(HttpListenerRequest request)
        {
            string bodyText = "";
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
            {
                bodyText = reader.ReadToEnd();
            }

            string base64A = ExtractJsonValue(bodyText, "templateA");
            string base64B = ExtractJsonValue(bodyText, "templateB");

            if (string.IsNullOrEmpty(base64A) || string.IsNullOrEmpty(base64B))
            {
                return "{\"success\":false,\"error\":\"Missing parameters 'templateA' or 'templateB'\"}";
            }

            try
            {
                byte[] tempA = Convert.FromBase64String(base64A);
                byte[] tempB = Convert.FromBase64String(base64B);

                if (tempA.Length < FEATURE_SIZE || tempB.Length < FEATURE_SIZE)
                {
                    return "{\"success\":false,\"error\":\"Invalid template size. Must decode to " + FEATURE_SIZE + " bytes.\"}";
                }

                int openRet = SfemOpen("temp.db", SENSOR_EB6048, 0);
                if (openRet < 0 && openRet != -100)
                {
                    return "{\"success\":false,\"error\":\"Failed to open engine (code: " + openRet + ")\"}";
                }

                IntPtr setRet = SfeFp(FP_SETFPDATA, tempB, IntPtr.Zero, IntPtr.Zero);
                if (setRet.ToInt64() < 0)
                {
                    SfemClose();
                    return "{\"success\":false,\"error\":\"Failed to load template (code: " + setRet.ToInt64() + ")\"}";
                }

                IntPtr verifyRet = SfeFp(FP_VERIFYFPDATA, tempA, IntPtr.Zero, IntPtr.Zero);
                bool matched = verifyRet.ToInt64() > 0;

                SfemClose();
                return "{\"success\":true,\"matched\":" + (matched ? "true" : "false") + ",\"code\":" + verifyRet.ToInt64() + "}";
            }
            catch (Exception ex)
            {
                return "{\"success\":false,\"error\":\"Verification failed: " + ex.Message.Replace("\"", "\\\"") + "\"}";
            }
        }

        private static string ExtractJsonValue(string json, string key)
        {
            string pattern = "\"" + key + "\"[\\s]*:[\\s]*\"([^\"]+)\"";
            Match match = Regex.Match(json, pattern);
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
            return null;
        }
    }
}
