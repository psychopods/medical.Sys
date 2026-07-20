using System;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Runtime.InteropServices;

namespace SfeWindowsProxy
{
    class Program
    {
        // Port to listen on
        private static int port = 5000;
        private static HttpListener listener;

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
        // DllImports for SFEMediator (Handles scanning & image processing)
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
        // DllImports for SFE (Handles raw template comparisons)
        // ----------------------------------------------------------------------------------
        [DllImport("SFE.dll", EntryPoint = "fp", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr fp32(IntPtr FuncNo, IntPtr Param1, IntPtr Param2, IntPtr Param3);

        [DllImport("SFE64.dll", EntryPoint = "fp", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr fp64(IntPtr FuncNo, IntPtr Param1, IntPtr Param2, IntPtr Param3);

        // ----------------------------------------------------------------------------------
        // Wrapper Methods helper to load 32-bit or 64-bit DLL depending on runtime process
        // ----------------------------------------------------------------------------------
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

        // ----------------------------------------------------------------------------------
        // HTTP Server Entry Point
        // ----------------------------------------------------------------------------------
        static void Main(string[] args)
        {
            if (args.Length > 0 && int.TryParse(args[0], out int customPort))
            {
                port = customPort;
            }

            Console.WriteLine("=====================================================");
            Console.WriteLine("        SFE Windows Biometric Proxy Server           ");
            Console.WriteLine("=====================================================");
            Console.WriteLine($"Running as {(Environment.Is64BitProcess ? "64-bit" : "32-bit")} process.");
            Console.WriteLine("Make sure appropriate DLLs are in this directory:");
            Console.WriteLine("- 32-bit: SFE.dll, SFEMediator.dll");
            Console.WriteLine("- 64-bit: SFE64.dll, SFEMediator64.dll");
            Console.WriteLine("=====================================================\n");

            listener = new HttpListener();
            listener.Prefixes.Add($"http://localhost:{port}/");
            
            try
            {
                listener.Start();
                Console.WriteLine($"Proxy server is listening on http://localhost:{port}/");
                Console.WriteLine("Press Ctrl+C to exit...\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error starting HTTP listener: {ex.Message}");
                Console.WriteLine("Make sure you are running as Administrator if required, or port is free.");
                return;
            }

            while (true)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Listener error: {ex.Message}");
                    break;
                }
            }
        }

        // ----------------------------------------------------------------------------------
        // Process HTTP Request
        // ----------------------------------------------------------------------------------
        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            // Enable CORS so browser apps can communicate with localhost proxy
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
                jsonResponse = $"{{\"success\":false,\"error\":\"Internal Server Error: {ex.Message.Replace("\"", "\\\"")}\"}}";
            }

            byte[] buffer = Encoding.UTF8.GetBytes(jsonResponse);
            response.ContentLength64 = buffer.Length;
            try
            {
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error writing response: {ex.Message}");
            }
        }

        // ----------------------------------------------------------------------------------
        // API Handler: /capture
        // ----------------------------------------------------------------------------------
        private static string HandleCaptureRequest(HttpListenerRequest request)
        {
            // Parse sensor type from query string (default is SENSOR_EB6048 = 4)
            int sensorType = SENSOR_EB6048;
            string sensorParam = request.QueryString["sensorType"];
            if (!string.IsNullOrEmpty(sensorParam) && int.TryParse(sensorParam, out int parsedSensor))
            {
                sensorType = parsedSensor;
            }

            Console.WriteLine($"[Capture] Starting scan (Sensor Type: {sensorType})...");

            // Open device
            // We use a dummy file name "temp.db" to initialize the SFE mediator
            int openRet = SfemOpen("temp.db", sensorType, 0);
            if (openRet < 0)
            {
                Console.WriteLine($"[Capture] Open failed (code: {openRet})");
                return $"{{\"success\":false,\"error\":\"Failed to open biometric reader (code: {openRet})\"}}";
            }

            try
            {
                Console.WriteLine("[Capture] Waiting for finger on sensor...");
                DateTime startTime = DateTime.Now;
                bool fingerDetected = false;

                // Loop for up to 10 seconds waiting for a finger
                while ((DateTime.Now - startTime).TotalSeconds < 10.0)
                {
                    int isFinger = SfemIsFinger();
                    if (isFinger < 0)
                    {
                        Console.WriteLine($"[Capture] IsFinger error (code: {isFinger})");
                        SfemClose();
                        return $"{{\"success\":false,\"error\":\"Sensor read error (code: {isFinger})\"}}";
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
                    Console.WriteLine("[Capture] Timeout: No finger detected");
                    SfemClose();
                    return "{\"success\":false,\"error\":\"Timeout waiting for finger placement\"}";
                }

                // Capture image
                int capRet = SfemCapture();
                if (capRet < 0)
                {
                    Console.WriteLine($"[Capture] Capture failed (code: {capRet})");
                    SfemClose();
                    return $"{{\"success\":false,\"error\":\"Failed to capture image (code: {capRet})\"}}";
                }

                // Extract template
                byte[] template = new byte[FEATURE_SIZE];
                int extRet = SfemTemplateGetFromImage(template);
                if (extRet < 0)
                {
                    Console.WriteLine($"[Capture] Template extraction failed (code: {extRet})");
                    SfemClose();
                    return $"{{\"success\":false,\"error\":\"Failed to extract template (code: {extRet})\"}}";
                }

                Console.WriteLine("[Capture] Fingerprint successfully captured!");
                string base64Template = Convert.ToBase64String(template);
                SfemClose();

                return $"{{\"success\":true,\"template\":\"{base64Template}\"}}";
            }
            catch (Exception ex)
            {
                SfemClose();
                return $"{{\"success\":false,\"error\":\"Capture Exception: {ex.Message.Replace("\"", "\\\"")}\"}}";
            }
        }

        // ----------------------------------------------------------------------------------
        // API Handler: /verify
        // ----------------------------------------------------------------------------------
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
                    return $"{{\"success\":false,\"error\":\"Invalid template size. Must decode to {FEATURE_SIZE} bytes.\"}}";
                }

                Console.WriteLine("[Verify] Matching templates...");

                // Open the engine (we don't need real hardware for matching, so ignore any hardware -100 error)
                int openRet = SfemOpen("temp.db", SENSOR_EB6048, 0);
                if (openRet < 0 && openRet != -100)
                {
                    return $"{{\"success\":false,\"error\":\"Failed to open engine (code: {openRet})\"}}";
                }

                // Load template B into slot 0
                IntPtr setRet = SfeFp(FP_SETFPDATA, tempB, IntPtr.Zero, IntPtr.Zero);
                if (setRet.ToInt64() < 0)
                {
                    SfemClose();
                    return $"{{\"success\":false,\"error\":\"Failed to load template (code: {setRet.ToInt64()})\"}}";
                }

                // Verify template A against slot 0
                IntPtr verifyRet = SfeFp(FP_VERIFYFPDATA, tempA, IntPtr.Zero, IntPtr.Zero);
                bool matched = verifyRet.ToInt64() > 0;

                Console.WriteLine($"[Verify] Finished. Match: {matched} (code: {verifyRet.ToInt64()})");

                SfemClose();
                return $"{{\"success\":true,\"matched\":{(matched ? "true" : "false")},\"code\":{verifyRet.ToInt64()}}}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"error\":\"Verification failed: {ex.Message.Replace("\"", "\\\"")}\"}}";
            }
        }

        // Helper to extract JSON values without external libraries
        private static string ExtractJsonValue(string json, string key)
        {
            string pattern = "\"" + key + "\"[\\s]*:[\\s]*\"([^\"]+)\"";
            var match = Regex.Match(json, pattern);
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
            return null;
        }
    }
}
