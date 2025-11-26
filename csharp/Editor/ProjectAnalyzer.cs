using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEditor;
using System.Text;

public class ProjectAnalyzer : EditorWindow
{
	private string outputPath = "ProjectSnapshot.json";
	private string compareFilePath = "";

	[MenuItem("Tools/Project Analyzer")]
	public static void ShowWindow()
	{
		GetWindow<ProjectAnalyzer>("Project Analyzer");
	}

	private void OnGUI()
	{
		GUILayout.Label("Export Project Structure", EditorStyles.boldLabel);

		if (GUILayout.Button("Export Current Project to JSON"))
		{
			ExportProjectToJson();
		}

		GUILayout.Space(10);
		GUILayout.Label("Compare Projects", EditorStyles.boldLabel);

		compareFilePath = EditorGUILayout.TextField("Previous JSON Path:", compareFilePath);

		if (GUILayout.Button("Compare with Previous Version"))
		{
			CompareProjects();
		}
	}

	private void ExportProjectToJson()
	{
		ProjectSnapshot snapshot = new ProjectSnapshot();

		// Scan all assets
		string[] allAssetPaths = AssetDatabase.GetAllAssetPaths()
			.Where(p => p.StartsWith("Assets/"))
			.ToArray();

		foreach (string assetPath in allAssetPaths)
		{
			AssetInfo info = new AssetInfo
			{
				path = assetPath,
				guid = AssetDatabase.AssetPathToGUID(assetPath),
				type = AssetDatabase.GetMainAssetTypeAtPath(assetPath)?.Name ?? "Unknown",
				fileSize = GetFileSize(assetPath)
			};

			snapshot.assets.Add(info);
		}

		string json = JsonUtility.ToJson(snapshot, true);
		File.WriteAllText(outputPath, json);

		Debug.Log($"Project exported to: {Path.GetFullPath(outputPath)}");
		EditorUtility.DisplayDialog("Success", $"Exported {snapshot.assets.Count} assets", "OK");
	}

	private void CompareProjects()
	{
		if (!File.Exists(compareFilePath))
		{
			EditorUtility.DisplayDialog("Error", "Previous JSON file not found!", "OK");
			return;
		}

		string currentJson = File.ReadAllText(outputPath);
		string previousJson = File.ReadAllText(compareFilePath);

		ProjectSnapshot current = JsonUtility.FromJson<ProjectSnapshot>(currentJson);
		ProjectSnapshot previous = JsonUtility.FromJson<ProjectSnapshot>(previousJson);

		ComparisonResult result = CompareSnapshots(previous, current);

		// Display results
		StringBuilder report = new StringBuilder();
		report.AppendLine($"=== PROJECT COMPARISON REPORT ===\n");
		report.AppendLine($"Added Assets: {result.added.Count}");
		report.AppendLine($"Removed Assets: {result.removed.Count}");
		report.AppendLine($"Modified Assets: {result.modified.Count}\n");

		if (result.added.Count > 0)
		{
			report.AppendLine("--- ADDED ---");
			foreach (var asset in result.added.Take(10))
			{
				report.AppendLine($"  + {asset.path} ({asset.type})");
			}
			if (result.added.Count > 10) report.AppendLine($"  ... and {result.added.Count - 10} more");
			report.AppendLine();
		}

		if (result.removed.Count > 0)
		{
			report.AppendLine("--- REMOVED ---");
			foreach (var asset in result.removed.Take(10))
			{
				report.AppendLine($"  - {asset.path} ({asset.type})");
			}
			if (result.removed.Count > 10) report.AppendLine($"  ... and {result.removed.Count - 10} more");
			report.AppendLine();
		}

		if (result.modified.Count > 0)
		{
			report.AppendLine("--- MODIFIED ---");
			foreach (var asset in result.modified.Take(10))
			{
				report.AppendLine($"  * {asset.path}");
			}
			if (result.modified.Count > 10) report.AppendLine($"  ... and {result.modified.Count - 10} more");
		}

		Debug.Log(report.ToString());

		string reportPath = "ComparisonReport.txt";
		File.WriteAllText(reportPath, report.ToString());
		EditorUtility.DisplayDialog("Comparison Complete",
			$"Report saved to: {Path.GetFullPath(reportPath)}", "OK");
	}

	private ComparisonResult CompareSnapshots(ProjectSnapshot old, ProjectSnapshot current)
	{
		ComparisonResult result = new ComparisonResult();

		Dictionary<string, AssetInfo> oldDict = old.assets.ToDictionary(a => a.guid);
		Dictionary<string, AssetInfo> currentDict = current.assets.ToDictionary(a => a.guid);

		// Find added assets
		foreach (var asset in current.assets)
		{
			if (!oldDict.ContainsKey(asset.guid))
			{
				result.added.Add(asset);
			}
		}

		// Find removed assets
		foreach (var asset in old.assets)
		{
			if (!currentDict.ContainsKey(asset.guid))
			{
				result.removed.Add(asset);
			}
		}

		// Find modified assets
		foreach (var asset in current.assets)
		{
			if (oldDict.TryGetValue(asset.guid, out AssetInfo oldAsset))
			{
				if (asset.fileSize != oldAsset.fileSize || asset.path != oldAsset.path)
				{
					result.modified.Add(asset);
				}
			}
		}

		return result;
	}

	private long GetFileSize(string assetPath)
	{
		string fullPath = Path.GetFullPath(assetPath);
		if (File.Exists(fullPath))
		{
			return new FileInfo(fullPath).Length;
		}
		return 0;
	}
}

[System.Serializable]
public class ProjectSnapshot
{
	public List<AssetInfo> assets = new List<AssetInfo>();
}

[System.Serializable]
public class AssetInfo
{
	public string path;
	public string guid;
	public string type;
	public long fileSize;
}

public class ComparisonResult
{
	public List<AssetInfo> added = new List<AssetInfo>();
	public List<AssetInfo> removed = new List<AssetInfo>();
	public List<AssetInfo> modified = new List<AssetInfo>();
}
