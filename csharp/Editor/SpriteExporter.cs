using UnityEngine;
using UnityEditor;
using System.IO;

public class SpriteExporter : EditorWindow
{
	private string exportPath = "Assets/ExportedSprites";
	private bool includeSubfolders = true;
	private string sourceFolder = "Assets";

	[MenuItem("Tools/Sprite Exporter")]
	public static void ShowWindow()
	{
		GetWindow<SpriteExporter>("Sprite Exporter");
	}

	private void OnGUI()
	{
		GUILayout.Label("Export Sprites to PNG", EditorStyles.boldLabel);
		GUILayout.Space(10);

		sourceFolder = EditorGUILayout.TextField("Source Folder:", sourceFolder);
		exportPath = EditorGUILayout.TextField("Export Path:", exportPath);
		includeSubfolders = EditorGUILayout.Toggle("Include Subfolders:", includeSubfolders);

		GUILayout.Space(10);

		if (GUILayout.Button("Export All Sprites", GUILayout.Height(30)))
		{
			ExportSprites();
		}

		GUILayout.Space(5);

		if (GUILayout.Button("Export Selected Sprites", GUILayout.Height(30)))
		{
			ExportSelectedSprites();
		}
	}

	private void ExportSprites()
	{
		// Tạo thư mục export nếu chưa có
		if (!Directory.Exists(exportPath))
		{
			Directory.CreateDirectory(exportPath);
		}

		// Tìm tất cả các sprite trong project
		string searchFolder = includeSubfolders ? sourceFolder : sourceFolder;
		string[] guids = AssetDatabase.FindAssets("t:Sprite", new[] { searchFolder });

		int exportedCount = 0;

		foreach (string guid in guids)
		{
			string assetPath = AssetDatabase.GUIDToAssetPath(guid);
			Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);

			if (sprite != null)
			{
				if (ExportSpriteToPNG(sprite, assetPath))
				{
					exportedCount++;
				}
			}
		}

		AssetDatabase.Refresh();
		EditorUtility.DisplayDialog("Export Complete",
			$"Đã export {exportedCount} sprites thành công!\nĐường dẫn: {exportPath}", "OK");
	}

	private void ExportSelectedSprites()
	{
		if (Selection.objects.Length == 0)
		{
			EditorUtility.DisplayDialog("No Selection",
				"Vui lòng chọn ít nhất một sprite trong Project window!", "OK");
			return;
		}

		if (!Directory.Exists(exportPath))
		{
			Directory.CreateDirectory(exportPath);
		}

		int exportedCount = 0;

		foreach (Object obj in Selection.objects)
		{
			Sprite sprite = obj as Sprite;
			if (sprite != null)
			{
				string assetPath = AssetDatabase.GetAssetPath(sprite);
				if (ExportSpriteToPNG(sprite, assetPath))
				{
					exportedCount++;
				}
			}
		}

		AssetDatabase.Refresh();
		EditorUtility.DisplayDialog("Export Complete",
			$"Đã export {exportedCount} sprites được chọn thành công!\nĐường dẫn: {exportPath}", "OK");
	}

	private bool ExportSpriteToPNG(Sprite sprite, string assetPath)
	{
		try
		{
			// Lấy texture từ sprite
			Texture2D texture = GetTextureFromSprite(sprite);

			if (texture == null)
			{
				Debug.LogWarning($"Không thể lấy texture từ sprite: {sprite.name}");
				return false;
			}

			// Tạo tên file
			string fileName = sprite.name + ".png";
			string fullPath = Path.Combine(exportPath, fileName);

			// Nếu file đã tồn tại, thêm số vào tên
			int counter = 1;
			while (File.Exists(fullPath))
			{
				fileName = $"{sprite.name}_{counter}.png";
				fullPath = Path.Combine(exportPath, fileName);
				counter++;
			}

			// Encode và save
			byte[] pngData = texture.EncodeToPNG();
			File.WriteAllBytes(fullPath, pngData);

			Debug.Log($"Đã export: {sprite.name} -> {fullPath}");
			return true;
		}
		catch (System.Exception e)
		{
			Debug.LogError($"Lỗi khi export sprite {sprite.name}: {e.Message}");
			return false;
		}
	}

	private Texture2D GetTextureFromSprite(Sprite sprite)
	{
		// Lấy texture gốc
		Texture2D texture = sprite.texture;

		// Kiểm tra xem texture có thể đọc được không
		string assetPath = AssetDatabase.GetAssetPath(texture);
		TextureImporter textureImporter = AssetImporter.GetAtPath(assetPath) as TextureImporter;

		bool wasReadable = textureImporter.isReadable;
		TextureImporterType originalType = textureImporter.textureType;

		// Tạm thời enable Read/Write nếu cần
		if (!wasReadable)
		{
			textureImporter.isReadable = true;
			AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
		}

		// Tạo texture mới từ sprite rect
		Texture2D newTexture = new Texture2D((int)sprite.rect.width, (int)sprite.rect.height);
		Color[] pixels = texture.GetPixels(
			(int)sprite.rect.x,
			(int)sprite.rect.y,
			(int)sprite.rect.width,
			(int)sprite.rect.height
		);
		newTexture.SetPixels(pixels);
		newTexture.Apply();

		// Khôi phục setting cũ
		if (!wasReadable)
		{
			textureImporter.isReadable = wasReadable;
			AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
		}

		return newTexture;
	}
}
