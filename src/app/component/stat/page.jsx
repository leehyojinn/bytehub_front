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
import {checkAuthStore, useAlertModalStore} from "@/app/zustand/store";
import AlertModal from "@/app/component/alertmodal/page";

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
  const [downloadStats, setDownloadStats] = useState([]);
  const [downloadStatsLoading, setDownloadStatsLoading] = useState(false);
  const [downloadStatsError, setDownloadStatsError] = useState("");

  const blockId = checkAuthStore();
  const alertModal = useAlertModalStore();

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

  // 파일별 다운로드 횟수 검색 필터
  const filteredDownloadStats = downloadStats.filter(
    s => s.filename.includes(downloadSearch) || s.dept_name.includes(downloadSearch)
  );

  // 전체 직원 근태 통계 가져오기
  useEffect(() => {
      blockId.redirect({session:sessionStorage, alert:alertModal});

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

  // 파일별 다운로드 횟수 통계 가져오기
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setDownloadStatsError("로그인이 필요합니다.");
      return;
    }

    setDownloadStatsLoading(true);
    setDownloadStatsError("");
    
    fetch(`${apiUrl}/cloud/download/count`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(result => {
        console.log('파일별 다운로드 횟수 통계 API 응답:', result);
        if (result.success) {
          setDownloadStats(result.data);
        } else {
          setDownloadStatsError(result.message || "다운로드 통계 조회 실패");
        }
      })
      .catch((err) => {
        console.error('파일별 다운로드 횟수 통계 조회 실패:', err);
        setDownloadStatsError("서버 오류");
      })
      .finally(() => setDownloadStatsLoading(false));
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

  // 파일별 다운로드 횟수 그래프 데이터
  const downloadBarData = {
    labels: filteredDownloadStats.map(s => {
      // 파일명이 15자 이상이면 축약
      const filename = s.filename;
      return filename.length > 15 ? filename.substring(0, 15) + '...' : filename;
    }),
    datasets: [
      {
        label: "다운로드 횟수",
        data: filteredDownloadStats.map(s => s.download_count),
        backgroundColor: "#4CAF50",
      },
    ],
  };

  // 그래프 옵션에 툴팁 커스터마이징 추가
  const downloadChartOptions = {
    responsive: true,
    plugins: { 
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          title: function(context) {
            // 툴팁에서 전체 파일명 표시
            const index = context[0].dataIndex;
            return filteredDownloadStats[index]?.filename || context[0].label;
          }
        }
      }
    },
    scales: { 
      y: { beginAtZero: true, stepSize: 1 },
      x: {
        ticks: {
          maxRotation: 45, // 라벨 회전
          minRotation: 0
        }
      }
    },
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
                  placeholder="파일명/부서 검색"
                  value={downloadSearch}
                  onChange={e => setDownloadSearch(e.target.value)}
                />
                <span className="su_small_text" style={{ display: 'block', textAlign: 'center', width: '100%' }}>파일별 다운로드 횟수 통계</span>
              </div>
              <div style={{ maxWidth: 760, margin: "0 auto 30px" }}>
                <Bar
                  data={downloadBarData}
                  options={downloadChartOptions}
                  height={320}
                />
              </div>
              {downloadStatsLoading && <div style={{marginBottom:10}}>로딩 중...</div>}
              {downloadStatsError && <div style={{color:'red',marginBottom:10}}>{downloadStatsError}</div>}
              <table className="stat_table">
                <thead>
                  <tr>
                    <th>파일명</th>
                    <th>부서</th>
                    <th>다운로드 횟수</th>
                    <th>다운로드한 사용자</th>
                    <th>다운로드 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDownloadStats.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#aaa' }}>다운로드 통계가 없습니다.</td>
                    </tr>
                  )}
                  {filteredDownloadStats.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.filename}</td>
                      <td>{s.dept_name || '미지정'}</td>
                      <td>{s.download_count}</td>
                      <td>{s.user_ids || '-'}</td>
                      <td>{s.download_times || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AlertModal/>
      <Footer />
    </div>
  );
}
