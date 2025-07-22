'use client';

import React, { useState, useEffect } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import {checkAuthStore} from "@/app/zustand/store";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// 예시 데이터: 파일별 다운로드 상세 기록
const downloadHistory = [
  { file: "사내규정.pdf", user: "홍길동", userId: "hong123", date: "2025-07-01 09:12" },
  { file: "사내규정.pdf", user: "김철수", userId: "kim456", date: "2025-07-01 10:16" },
  { file: "연차신청서.docx", user: "이영희", userId: "lee789", date: "2025-07-02 13:40" },
  { file: "사내규정.pdf", user: "이영희", userId: "lee789", date: "2025-07-03 09:55" },
  { file: "프로젝트계획서.pptx", user: "홍길동", userId: "hong123", date: "2025-07-03 15:20" },
  { file: "연차신청서.docx", user: "홍길동", userId: "hong123", date: "2025-07-04 09:01" },
  { file: "출장비내역.xlsx", user: "김철수", userId: "kim456", date: "2025-07-04 12:30" },
];

// API 서버 주소 (환경변수에서 가져오거나 기본값 사용)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export default function StatisticsPage() {
  const [tab, setTab] = useState("attendance");
  const [search, setSearch] = useState("");
  const [downloadSearch, setDownloadSearch] = useState("");
  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState("");
  const [attendanceStats, setAttendanceStats] = useState([]);

  const blockId = checkAuthStore();

  // 직원 근태 통계 검색 필터
  const filteredAttendance = attendanceStats.filter(
    s => s.name.includes(search) || s.id.includes(search) || s.dept.includes(search)
  );

  // 다운로드 기록 검색 필터 (파일명, 이름, 아이디, 날짜)
  const filteredDownloadHistory = downloadHistory.filter(
    h =>
      h.file.includes(downloadSearch) ||
      h.user.includes(downloadSearch) ||
      h.userId.includes(downloadSearch) ||
      h.date.includes(downloadSearch)
  );

  // 전체 직원 근태 통계 가져오기
  useEffect(() => {
    blockId.redirect({session:sessionStorage});

    const token = sessionStorage.getItem('token');
    if (!token) {
      setStatError("로그인이 필요합니다.");
      return;
    }

    setStatLoading(true);
    setStatError("");
    
    fetch(`${apiUrl}/attendance/stat/all`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(result => {
        console.log('전체 직원 근태 통계 API 응답:', result);
        if (result.success) {
          // 백엔드에서 이미 가공된 데이터를 그대로 사용
          setAttendanceStats(result.data);
        } else {
          setStatError(result.msg || "통계 조회 실패");
        }
      })
      .catch((err) => {
        console.error('전체 직원 근태 통계 조회 실패:', err);
        setStatError("서버 오류");
      })
      .finally(() => setStatLoading(false));
  }, []);

  // 그래프 데이터 (API 데이터 반영됨)
  const attendanceBarData = {
    labels: filteredAttendance.map(s => s.name),
    datasets: [
      {
        label: "정상출근",
        data: filteredAttendance.map(s => s.days_present),
        backgroundColor: "#7c6ee6",
      },
      {
        label: "지각",
        data: filteredAttendance.map(s => s.late),
        backgroundColor: "#ffb347",
      },
      {
        label: "조퇴",
        data: filteredAttendance.map(s => s.earlyLeave || 0),
        backgroundColor: "#6ec6e6",
      },
      {
        label: "결석",
        data: filteredAttendance.map(s => s.absent),
        backgroundColor: "#ff6f61",
      },
      {
        label: "연차",
        data: filteredAttendance.map(s => s.annual_leave),
        backgroundColor: "#43b8c6",
      },
    ],
  };

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 stat_box">
          <div className="card_title font_700 mb_20">통계</div>
          <div className="stat_tab_row flex gap_10 mb_20 justify_center">
            <button
              className={`stat_tab_btn${tab === "attendance" ? " active" : ""}`}
              onClick={() => setTab("attendance")}
            >직원 근태 통계</button>
            <button
              className={`stat_tab_btn${tab === "download" ? " active" : ""}`}
              onClick={() => setTab("download")}
            >다운로드 통계</button>
          </div>

          {tab === "attendance" && (
            <div>
              <div className="flex gap_10 align_center mb_20">
                <input
                  className="board_write_input"
                  style={{ width: 220 }}
                  placeholder="이름/아이디/부서 검색"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <span className="su_small_text" style={{ display: 'block', textAlign: 'center', width: '100%' }}>전체 직원 근태 통계 (정상출근/지각/조퇴/결석/연차)</span>
              </div>
              <div style={{ maxWidth: 760, margin: "0 auto 30px" }}>
                <Bar
                  data={attendanceBarData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true, stepSize: 1 } },
                  }}
                  height={320}
                />
              </div>
              {statLoading && <div style={{marginBottom:10}}>로딩 중...</div>}
              {statError && <div style={{color:'red',marginBottom:10}}>{statError}</div>}
              <table className="stat_table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>아이디</th>
                    <th>부서</th>
                    <th>출근</th>
                    <th>지각</th>
                    <th>조퇴</th>
                    <th>결석</th>
                    <th>연차</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#aaa' }}>검색 결과가 없습니다.</td>
                    </tr>
                  )}
                  {filteredAttendance.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.id}</td>
                      <td>{s.dept}</td>
                      <td>{s.days_present}</td>
                      <td>{s.late}</td>
                      <td>{s.earlyLeave || 0}</td>
                      <td>{s.absent}</td>
                      <td>{s.annual_leave}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "download" && (
            <div>
              <div className="flex gap_10 align_center mb_20">
                <input
                  className="board_write_input"
                  style={{ width: 220 }}
                  placeholder="파일명/이름/아이디/날짜 검색"
                  value={downloadSearch}
                  onChange={e => setDownloadSearch(e.target.value)}
                />
                <span className="su_small_text">파일별 다운로드 기록</span>
              </div>
              <table className="stat_table">
                <thead>
                  <tr>
                    <th>파일명</th>
                    <th>다운로드자</th>
                    <th>아이디</th>
                    <th>다운로드 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDownloadHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>다운로드 기록이 없습니다.</td>
                    </tr>
                  )}
                  {filteredDownloadHistory.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.file}</td>
                      <td>{h.user}</td>
                      <td>{h.userId}</td>
                      <td>{h.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
