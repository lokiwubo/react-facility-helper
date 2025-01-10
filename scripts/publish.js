import fs from "fs";
import path from "path";

// 定义要遍历的文件夹路径
const distFolderPath = path.join(__dirname, "dist");

// 删除 .map 文件的函数
function deleteMapFiles(folderPath) {
  // 读取文件夹中的所有文件和子文件夹
  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`无法读取文件夹: ${err}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file.name);

      if (file.isDirectory()) {
        // 如果是子文件夹，递归调用删除函数
        deleteMapFiles(filePath);
      } else if (path.extname(file.name) === ".map") {
        // 如果是 .map 文件，删除它
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`无法删除文件 ${filePath}: ${err}`);
          } else {
            console.log(`已删除文件 ${filePath}`);
          }
        });
      }
    });
  });
}

// 调用删除函数
deleteMapFiles(distFolderPath);
