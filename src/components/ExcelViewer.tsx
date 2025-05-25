import React, { useEffect, useState } from 'react';
import useExcelReader from '../hooks/useExcelReader';
import { Spin, Alert, Tabs, Tag, Radio, Checkbox, Button, message, Typography, InputNumber } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './ExcelViewer.css';

const { TabPane } = Tabs;
// const { Panel } = Collapse;
const { Text } = Typography;

interface ExcelViewerProps {
  filePath: string;
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ filePath }) => {
  const { sheets, isLoading, error, refreshTestQuestions } = useExcelReader(filePath);
  const [activeTab, setActiveTab] = useState<string>('0');
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string[] }>({});
  const [checkedAnswers, setCheckedAnswers] = useState<{ [key: string]: boolean }>({});
  const [jumpToQuestion, setJumpToQuestion] = useState<number | null>(null);
  const [hasPermission, setPermission] = useState<boolean>(false);
  useEffect(() => {
    if (location.search === '?kt') {
      setPermission(true);
    }
  }, [])

  if (isLoading) {
    return <Spin tip="正在加载Excel数据..."></Spin>;
  }

  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon />;
  }

  if (!sheets || sheets.length === 0) {
    return <Alert message="提示" description="没有找到有效的数据" type="info" showIcon />;
  }

  // 处理答案选择
  const handleAnswerSelect = (sheetIndex: string, questionIndex: number, value: string, isMultiple: boolean, correctAnswer: string) => {
    const key = `${sheetIndex}-${questionIndex}`;

    if (isMultiple) {
      // 多选题处理
      setSelectedAnswers(prev => {
        const currentAnswers = prev[key] || [];
        const newAnswers = currentAnswers.includes(value)
          ? currentAnswers.filter(item => item !== value)
          : [...currentAnswers, value];
        return { ...prev, [key]: newAnswers };
      });
      // 多选题不立即检查，清除之前的检查结果
      setCheckedAnswers(prev => ({ ...prev, [key]: false }));
    } else {
      // 单选题处理 - 选择后立即检查
      setSelectedAnswers(prev => ({ ...prev, [key]: [value] }));

      // 立即检查单选题答案
      const formattedCorrectAnswers = correctAnswer.split(/[,，、\s]+/).map(ans => ans.trim());
      const isCorrect = formattedCorrectAnswers.includes(value);

      setCheckedAnswers(prev => ({ ...prev, [key]: true }));

      if (isCorrect) {
        message.success('回答正确！');
      } else {
        message.error(`回答错误，正确答案是: ${correctAnswer}`);
      }
    }
  };

  // 检查答案
  const checkAnswer = (sheetIndex: string, questionIndex: number, correctAnswer: string) => {
    const key = `${sheetIndex}-${questionIndex}`;
    const userAnswers = selectedAnswers[key] || [];

    // 处理正确答案格式（可能是A、B、C或A,B,C等格式）
    const formattedCorrectAnswers = correctAnswer.split(/[,，、\s]+/).map(ans => ans.trim()).join('').split('');

    // 检查用户答案是否与正确答案匹配
    const isCorrect = formattedCorrectAnswers.length === userAnswers.length &&
      formattedCorrectAnswers.every(ans => userAnswers.includes(ans));
    console.log('用户答案:', userAnswers, '正确答案数组:', formattedCorrectAnswers, '是否匹配:', isCorrect)
    setCheckedAnswers(prev => ({ ...prev, [key]: true }));

    if (isCorrect) {
      message.success('回答正确！');
    } else {
      message.error('回答错误！');
    }

    return isCorrect;
  };

  // 导航到下一题
  const goToNextQuestion = () => {
    if (!sheets || sheets.length === 0) return;

    const currentSheet = sheets[parseInt(activeTab)];
    if (currentQuestion < currentSheet.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (parseInt(activeTab) < sheets.length - 1) {
      // 如果是当前sheet的最后一题，切换到下一个sheet的第一题
      setActiveTab(String(parseInt(activeTab) + 1));
      setCurrentQuestion(0);
    }
  };

  // 导航到上一题
  const goToPrevQuestion = () => {
    if (!sheets || sheets.length === 0) return;

    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (parseInt(activeTab) > 0) {
      // 如果是当前sheet的第一题，切换到上一个sheet的最后一题
      const prevTabIndex = parseInt(activeTab) - 1;
      setActiveTab(String(prevTabIndex));
      setCurrentQuestion(sheets[prevTabIndex].questions.length - 1);
    }
  };

  // 跳转到指定题目
  const handleJumpToQuestion = () => {
    if (!sheets || sheets.length === 0 || jumpToQuestion === null) return;

    const currentSheet = sheets[parseInt(activeTab)];
    const totalQuestions = currentSheet.questions.length;

    // 验证输入的题号是否有效
    if (jumpToQuestion > 0 && jumpToQuestion <= totalQuestions) {
      // 因为数组索引从0开始，所以需要减1
      setCurrentQuestion(jumpToQuestion - 1);
      message.success(`已跳转到第 ${jumpToQuestion} 题`);
    } else {
      message.error(`请输入有效的题号 (1-${totalQuestions})`);
    }
  };

  // 渲染选项
  const renderOptions = (question: any, sheetIndex: string, questionIndex: number) => {
    const key = `${sheetIndex}-${questionIndex}`;
    const isMultiple = String(question.type).toLowerCase().includes('多选');
    const userAnswers = selectedAnswers[key] || [];
    const isChecked = checkedAnswers[key];
    const correctAnswers = question.answer.split(/[,，、\s]+/).map((ans: string) => ans.trim()).join('').split('');

    if (!question.options || question.options.length === 0) {
      return null;
    }

    return (
      <div className="question-options">
        {isMultiple ? (
          <Checkbox.Group
            value={userAnswers}
            onChange={() => { }}
          >
            {question.options.map((option: string, index: number) => {
              const optionValue = String.fromCharCode(65 + index); // A, B, C, D...
              const isWrong = isChecked && userAnswers.includes(optionValue) && !correctAnswers.includes(optionValue);
              const isCorrect = isChecked && correctAnswers.includes(optionValue);

              return (
                <div key={index} className="option-item">
                  <Checkbox
                    value={optionValue}
                    onClick={() => handleAnswerSelect(sheetIndex, questionIndex, optionValue, true, question.answer)}
                    disabled={isChecked}
                    className={isWrong ? 'wrong-answer' : isCorrect ? 'correct-answer' : ''}
                  >
                    <Text
                      style={{
                        color: isWrong ? '#ff4d4f' : isCorrect ? '#52c41a' : 'inherit',
                        textDecoration: isWrong ? 'line-through' : 'none',
                        fontWeight: isCorrect ? 'bold' : 'normal'
                      }}
                    >
                      {optionValue}: {option}
                    </Text>
                  </Checkbox>
                </div>
              );
            })}
          </Checkbox.Group>
        ) : (
          <Radio.Group
            value={userAnswers[0]}
            onChange={() => { }}
          >
            {question.options.map((option: string, index: number) => {
              const optionValue = String.fromCharCode(65 + index); // A, B, C, D...
              const isWrong = isChecked && userAnswers.includes(optionValue) && !correctAnswers.includes(optionValue);
              const isCorrect = isChecked && correctAnswers.includes(optionValue);

              return (
                <div key={index} className="option-item">
                  <Radio
                    value={optionValue}
                    onClick={() => handleAnswerSelect(sheetIndex, questionIndex, optionValue, false, question.answer)}
                    disabled={isChecked}
                    className={isWrong ? 'wrong-answer' : isCorrect ? 'correct-answer' : ''}
                  >
                    <Text
                      style={{
                        color: isWrong ? '#ff4d4f' : isCorrect ? '#52c41a' : 'inherit',
                        textDecoration: isWrong ? 'line-through' : 'none',
                        fontWeight: isCorrect ? 'bold' : 'normal'
                      }}
                    >
                      {optionValue}: {option}
                    </Text>
                  </Radio>
                </div>
              );
            })}
          </Radio.Group>
        )}

        {/* 只为多选题显示检查按钮 */}
        {!isChecked && isMultiple && (
          <Button
            type="primary"
            onClick={() => checkAnswer(sheetIndex, questionIndex, question.answer)}
            className="check-button"
          >
            检查答案
          </Button>
        )}

        {isChecked && (
          <div className="answer-result">
            <p style={{ margin: 0 }}><strong>正确答案：</strong>{question.answer}</p>
          </div>
        )}
      </div>
    );
  };
  const handleChangeQuestions = () => {
    refreshTestQuestions();
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setCheckedAnswers({});
  }
  return (
    <div className="excel-viewer">
      <h2>刷题练习系统</h2>
      <Tabs activeKey={activeTab} onChange={key => {
        setActiveTab(key);
        setCurrentQuestion(0);
      }}>
        {(hasPermission ? sheets : sheets.slice(0, 3)).map((sheet, index) => {
          const currentQ = sheet.questions[index === parseInt(activeTab) ? currentQuestion : 0];
          return (
            <TabPane tab={sheet.sheetName} key={String(index)}>
              <div className="question-navigation">
                <h3>{sheet.sheetName} - 第 {currentQuestion + 1}/{sheet.questions.length} 题</h3>
                <div className="navigation-buttons">
                  { index === 3 ?                     
                  <Button
                      type="primary"
                      onClick={handleChangeQuestions}
                    >
                      刷新题库
                    </Button>: null}

                  <Button
                    type="primary"
                    icon={<LeftOutlined />}
                    onClick={goToPrevQuestion}
                    disabled={currentQuestion === 0 && parseInt(activeTab) === index}
                  >
                    上一题
                  </Button>
                  <Button
                    type="primary"
                    icon={<RightOutlined />}
                    onClick={goToNextQuestion}
                    disabled={currentQuestion === sheets[parseInt(activeTab)].questions.length - 1 && parseInt(activeTab) === sheets.length - 1}
                  >
                    下一题
                  </Button>
                  <div className="jump-question-container">
                    <span>跳转到</span>
                    <InputNumber
                      min={1}
                      max={sheet.questions.length}
                      value={jumpToQuestion}
                      onChange={(value) => setJumpToQuestion(value)}
                      className="jump-input"
                      onPressEnter={handleJumpToQuestion}
                      placeholder="输入题号"
                    />
                  </div>
                </div>
              </div>
              <div className="question-card">
                <div className="question-header">
                  <Tag color={getTypeColor(currentQ.type)}>{currentQ.type}</Tag>
                  <span className="question-title">{currentQ.title}</span>
                </div>

                <div className="question-detail">
                  {/* 根据题型渲染不同的内容 */}
                  {String(currentQ.type).toLowerCase().includes('单选') ||
                    String(currentQ.type).toLowerCase().includes('多选') ? (
                    renderOptions(currentQ, String(index), currentQuestion)
                  ) : (
                    <div className="case-answer">
                      <p><strong>答案：</strong>{currentQ.answer}</p>
                      {/* 显示其他可能的字段 */}
                      {Object.keys(currentQ).filter(key =>
                        !['id', 'title', 'type', 'options', 'answer'].includes(key)
                      ).map(key => (
                        <p key={key}><strong>{key}：</strong>{String(currentQ[key])}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabPane>
          );
        })}
      </Tabs>
    </div>
  );
};

// 根据题型返回不同的颜色
const getTypeColor = (type: string): string => {
  const typeStr = String(type).toLowerCase();
  if (typeStr.includes('单选')) return 'blue';
  if (typeStr.includes('多选')) return 'purple';
  if (typeStr.includes('判断')) return 'green';
  if (typeStr.includes('填空')) return 'orange';
  if (typeStr.includes('简答')) return 'red';
  return 'default';
};

export default ExcelViewer;
