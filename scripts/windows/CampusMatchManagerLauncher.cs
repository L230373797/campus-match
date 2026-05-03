using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        string projectRoot = FindProjectRoot();
        string scriptPath = Path.Combine(projectRoot, "scripts", "windows", "campus-manager-app.ps1");

        if (!File.Exists(scriptPath))
        {
            MessageBox.Show(
                "\u627e\u4e0d\u5230\u6821\u56ed\u5339\u914d\u9879\u76ee\u76ee\u5f55\u3002\u8bf7\u5148\u8fd0\u884c\u5b89\u88c5\u811a\u672c\uff0c\u6216\u8bbe\u7f6e CAMPUS_MATCH_ROOT\u3002",
                "\u6821\u56ed\u5339\u914d\u7ba1\u7406\u5668",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return;
        }

        string powershellPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.System),
            "WindowsPowerShell",
            "v1.0",
            "powershell.exe"
        );

        ProcessStartInfo startInfo = new ProcessStartInfo
        {
            FileName = powershellPath,
            Arguments = "-NoProfile -STA -ExecutionPolicy Bypass -File \"" + scriptPath + "\"",
            WorkingDirectory = projectRoot,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden
        };

        Process.Start(startInfo);
    }

    private static string FindProjectRoot()
    {
        string envRoot = Environment.GetEnvironmentVariable("CAMPUS_MATCH_ROOT");
        if (IsProjectRoot(envRoot))
        {
            return envRoot;
        }

        string configRoot = ReadConfiguredProjectRoot();
        if (IsProjectRoot(configRoot))
        {
            return configRoot;
        }

        string exeDir = Path.GetDirectoryName(Application.ExecutablePath);
        string current = exeDir;
        while (!string.IsNullOrEmpty(current))
        {
            if (IsProjectRoot(current))
            {
                return current;
            }

            DirectoryInfo parent = Directory.GetParent(current);
            current = parent == null ? null : parent.FullName;
        }

        string defaultRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "\u6821\u56ed\u9879\u76ee",
            "campus-match-dist"
        );
        return defaultRoot;
    }

    private static string ReadConfiguredProjectRoot()
    {
        try
        {
            string configPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "CampusMatchManager",
                "project-root.txt"
            );

            if (!File.Exists(configPath))
            {
                return null;
            }

            return File.ReadAllText(configPath).Trim();
        }
        catch
        {
            return null;
        }
    }

    private static bool IsProjectRoot(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return false;
        }

        string scriptPath = Path.Combine(path, "scripts", "windows", "campus-manager-app.ps1");
        return File.Exists(scriptPath);
    }
}
