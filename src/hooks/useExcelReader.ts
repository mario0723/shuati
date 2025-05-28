import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface ExamQuestion {
  id?: number;
  title: string;
  type: string;
  options?: string[];
  answer: string;
  [key: string]: any; // 允许其他可能的字段
}

interface SheetData {
  sheetName: string;
  questions: ExamQuestion[];
}

interface ExcelData {
  sheets: SheetData[];
  isLoading: boolean;
  error: string | null;
  refreshTestQuestions: () => void;
}

/**
 * 自定义Hook，用于读取Excel文件内容
 * @param filePath Excel文件路径
 * @returns 包含Excel数据的对象
 */
const useExcelReader = (filePath: string): ExcelData => {
  const [data, setData] = useState<SheetData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const generateTestQuestions = (sheets: SheetData[]) => {
    const sheet: SheetData = {
      sheetName: "考试模式",
      questions: [],
    };
    const questions = [...sheets[0].questions, ...sheets[1].questions];
    const singleQuestions = questions.filter(
      (question) => question.type === "单选题"
    );
    const multipleQuestions = questions.filter(
      (question) => question.type === "多选题"
    );

    for (let i = 0; i < 100; i++) {
      const min = i * Math.floor(singleQuestions.length / 100) + 1;
      const max = (i + 1) * Math.floor(singleQuestions.length / 100);
      const randomIndex = Math.floor(Math.random() * (max - min + 1) + min);
      // const findIndex = sheet.questions.findIndex(question => question.title === singleQuestions[randomIndex].title);
      // if (findIndex !== -1) continue;
      sheet.questions.push(singleQuestions[randomIndex]);
    }
    for (let i = 0; i < 50; i++) {
      const min = i * Math.floor(multipleQuestions.length / 50) + 1;
      const max = (i + 1) * Math.floor(multipleQuestions.length / 50);
      const randomIndex = Math.floor(Math.random() * (max - min + 1) + min);
      sheet.questions.push(multipleQuestions[randomIndex]);
    }
    return sheet;
  };
  const refreshTestQuestions = () => {
    const resources = data.slice(0, 3);
    const sheet = generateTestQuestions(resources);
    setData([...resources, sheet]);
  };
  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        setIsLoading(true);

        // 获取Excel文件
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();

        // 使用xlsx库解析Excel文件
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        // 处理每个sheet页
        const sheetsData: SheetData[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];

          if (jsonData.length > 0) {
            // 获取表头（第一行）
            const headers = jsonData[0] as string[];

            // 查找关键列的索引
            const titleIndex = headers.findIndex((header) =>
              /题目|问题|标题/.test(String(header))
            );
            const typeIndex = headers.findIndex((header) =>
              /题型|类型|题形/.test(String(header))
            );
            const answerIndex = headers.findIndex((header) =>
              /答案|正确答案|正确选项/.test(String(header))
            );

            // 处理每一行数据（从第二行开始）
            const questions: ExamQuestion[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue; // 跳过空行

              const type = row[typeIndex];
              const randomAnswer = String.fromCharCode(
                65 + Math.floor(Math.random() * 4)
              ); // 随机生成一个A、B、C或D的答案
              const answer = row[answerIndex]; // 如果没有答案，则使用随机生成的答案
              let question: ExamQuestion;
              if (/单选题/.test(String(type))) {
                question = {
                  id: i,
                  title: row[titleIndex] || "",
                  type: String(type) || "",
                  answer: randomAnswer || "",
                };
              } else {
                question = {
                  id: i,
                  title: row[titleIndex] || "",
                  type: String(type) || "",
                  answer: answer || "",
                };
              }

              // 处理选项（针对单选题和多选题）
              if (/单选题|多选题/.test(String(type))) {
                const options: string[] = [];

                // 查找选项列（通常是A、B、C、D等）
                const optionIndices: number[] = [];
                headers.forEach((header, index) => {
                  if (/^[A-Z]$|选项/.test(String(header))) {
                    if (header !== "正确选项") optionIndices.push(index);
                  }
                });

                // 如果找到选项列
                if (optionIndices.length > 0) {
                  optionIndices.forEach((index) => {
                    if (row[index]) {
                      options.push(row[index]);
                    }
                  });
                } else {
                  // 尝试从其他列中提取选项
                  for (let j = 0; j < headers.length; j++) {
                    if (
                      j !== titleIndex &&
                      j !== typeIndex &&
                      j !== answerIndex
                    ) {
                      const header = headers[j];
                      const value = row[j];

                      if (value && String(header).match(/^[A-Z]$|选项/)) {
                        options.push(`${header}: ${value}`);
                      }
                    }
                  }
                }
                if (/单选题/.test(String(type))) {
                  const originAnswer = answer.charCodeAt(0);
                  const offset = originAnswer - 65; // 偏移量
                  const newAnswer = randomAnswer.charCodeAt(0);
                  const newOffset = newAnswer - 65; // 新偏移量
                  const temp = options[offset];
                  options[offset] = options[newOffset];
                  options[newOffset] = temp;
                }
                question.options = options;
              }

              // 添加其他可能的字段
              headers.forEach((header, index) => {
                if (
                  index !== titleIndex &&
                  index !== typeIndex &&
                  index !== answerIndex
                ) {
                  if (row[index] !== undefined) {
                    question[String(header)] = row[index];
                  }
                }
              });
              questions.push(question);
            }

            sheetsData.push({
              sheetName,
              questions,
            });
          }
        });
        const testSheet = generateTestQuestions(sheetsData);
        sheetsData.push(testSheet);
        setData(sheetsData);
        setError(null);
      } catch (err) {
        console.error("读取Excel文件出错:", err);
        setError(
          "读取Excel文件出错: " +
            (err instanceof Error ? err.message : String(err))
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExcelData();
  }, [filePath]);

  return {
    sheets: data,
    isLoading,
    error,
    refreshTestQuestions,
  };
};

export default useExcelReader;
