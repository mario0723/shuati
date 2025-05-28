// import { useState } from 'react'
import './App.css'
import { Layout, Typography } from 'antd';
import ExcelViewer from './components/ExcelViewer';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  // Excel文件路径
  // const excelFilePath = '/shuati/集客考试题库2025.xlsx';
  const excelFilePathNew = '/shuati/试题上传.xlsx'
  return (
    <Layout className="app-container">
      <Header className="app-header">
        <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
          刷题练习系统
        </Title>
      </Header>
      <Content className="app-content" style={{ padding: '20px 10px' }}>
        <ExcelViewer filePath={excelFilePathNew} />
      </Content>
    </Layout>
  )
}

export default App
