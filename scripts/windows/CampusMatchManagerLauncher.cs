using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        string projectRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "\u6821\u56ed\u9879\u76ee",
            "campus-match-dist"
        );
        string scriptPath = Path.Combine(projectRoot, "scripts", "windows", "campus-manager-app.ps1");

        if (!File.Exists(scriptPath))
        {
            MessageBox.Show(
                "Cannot find campus-manager-app.ps1. Please check the project folder.",
                "Campus Match Manager",
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
}
