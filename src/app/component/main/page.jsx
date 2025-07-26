'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import CalendarCard from "../calendar/CalendarCard";
import axios from "axios";
import { useEffect } from "react";
import { useAppStore } from "@/app/zustand/store";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const MAX_LENGTH = 15;

function ellipsis(str, maxLength = MAX_LENGTH) {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
}

function formatDate(dateString) {
  return dateString?.slice(0, 10);
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHourAndMinute(datetimeStr) {
  if (!datetimeStr) return "-";
  return datetimeStr.slice(11, 13) + "시 " + datetimeStr.slice(14, 16) + "분";
}

// 근태통계 계산 함수 (출근, 연장근무, 지각/조퇴, 결석, 기타)
function getAttendanceStats(attList) {
  const stats = {
    출근: 0,
    연장근무: 0,
    "지각/조퇴": 0,
    결석: 0,
    기타: 0,
  };
  if (!attList) return stats;
  attList.forEach((item) => {
    if (item.att_type === "출근") stats.출근++;
    else if (item.att_type === "연장근무") stats.연장근무++;
    else if (item.att_type === "지각" || item.att_type === "조퇴") stats["지각/조퇴"]++;
    else if (item.att_type === "결석") stats.결석++;
    else stats.기타++;
  });
  return stats;
}

export default function Home() {
  const {
    myInfo,
    setMyInfo,
    approvals,
    setApprovals,
    cloud,
    setCloud,
    noticeList,
    setNoticeList,
    meetingList,
    setMeetingList,
    att,
    setAtt,
    loading,
    setLoading,
  } = useAppStore();

  // 내 정보 가져오기
  async function myInfoList() {
    setLoading(true);
    const token = sessionStorage.getItem("token");
    try {
      let { data } = await axios.get(`${apiUrl}/mypage/info`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
      setMyInfo(data.data);
    } catch {
      setMyInfo({});
    }
    setLoading(false);
  }

  // 게시판 리스트
  async function boardList() {
    setLoading(true);
    try {
      let { data } = await axios.post(`${apiUrl}/board/allList`);
      setMeetingList(data.list.filter((d) => d.category === "MEETING"));
      setNoticeList(data.list.filter((d) => d.category === "NOTICE"));
    } catch {
      setMeetingList([]);
      setNoticeList([]);
    }
    setLoading(false);
  }

  // 클라우드 목록
  async function cloudList() {
    if (!myInfo.dept_idx) return;
    setLoading(true);
    try {
      let { data } = await axios.get(`${apiUrl}/cloud/list`, {
        params: { deptIdx: myInfo.dept_idx },
      });
      if (data.success) setCloud(data.data);
      else setCloud([]);
    } catch {
      setCloud([]);
    }
    setLoading(false);
  }

  // 결재 문서 조회
  async function fetchApprovals() {
    if (!myInfo.user_id) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/appr/all`, {
        params: { user_id: myInfo.user_id },
      });
      if (data.success) setApprovals(data.data);
      else setApprovals([]);
    } catch {
      setApprovals([]);
    }
    setLoading(false);
  }

  // 근태 리스트 월별 조회 - 현재 월 기준
  async function attList() {
    if (!myInfo.user_id) return;
    setLoading(true);
    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      let { data } = await axios.get(`${apiUrl}/attendance/monthlyList`, {
        params: {
          user_id: myInfo.user_id,
          yearMonth,
        },
      });
      console.log(data.data)
      if (data.success) setAtt(data.data);
      else setAtt([]);
    } catch {
      setAtt([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    boardList();
    myInfoList();
  }, []);

  useEffect(() => {
    if (myInfo.dept_idx) cloudList();
  }, [myInfo.dept_idx]);

  useEffect(() => {
    if (myInfo.user_id) {
      fetchApprovals();
      attList();
    }
  }, [myInfo.user_id]);

  const today = getCurrentDate();

  // 오늘날짜 해당 근태 데이터 필터링
  const todayAttendance = att.filter((item) => item.att_date === today);

  // 오늘 출근(in_time) 중 가장 빠른 시간
  const inTimes = todayAttendance
    .filter((i) => i.in_time)
    .map((i) => new Date(i.in_time));
  const earliestInTime = inTimes.length > 0 ? new Date(Math.min(...inTimes)) : null;
  const earliestInTimeStr = earliestInTime
    ? earliestInTime.toISOString()
    : null;

  // 오늘 퇴근(out_time) 중 가장 늦은 시간
  const outTimes = todayAttendance
    .filter((i) => i.out_time)
    .map((i) => new Date(i.out_time));
  const latestOutTime = outTimes.length > 0 ? new Date(Math.max(...outTimes)) : null;
  const latestOutTimeStr = latestOutTime ? latestOutTime.toISOString() : null;

  // 출근, 연장근무, 지각/조퇴, 결석 통계 계산
  const attendanceCount = getAttendanceStats(att);

  const attendanceStats = [
    { label: "출근", value: attendanceCount.출근, color: "#4f8cff" },
    { label: "연장근무", value: attendanceCount.연장근무, color: "#34c759" },
    { label: "지각/조퇴", value: attendanceCount["지각/조퇴"], color: "#ff3b30" },
    { label: "결석", value: attendanceCount.결석, color: "#ff9500" },
  ];

  const totalAttendance = attendanceStats.reduce((sum, item) => sum + item.value, 0) || 1;

  // 공지사항 정렬
  const sortedList = [
    ...noticeList.filter((n) => n.pinned).sort((a, b) => a.post_idx - b.post_idx),
    ...noticeList.filter((n) => !n.pinned).sort((a, b) => new Date(b.reg_date) - new Date(a.reg_date)),
  ].slice(0, 5);

  // 회의록 필터링
  const filteredList = meetingList
    .filter((n) => (n.attendees && n.attendees.includes(myInfo.name)) || n.user_id === myInfo.user_id)
    .sort((a, b) => new Date(b.reg_date) - new Date(a.reg_date))
    .slice(0, 5);

  function getApprovalClassAndLabel(status) {
    switch (status) {
      case "반려":
        return { className: "approval_status_badge status_rejected", label: "반려" };
      case "기안":
        return { className: "approval_status_badge status_draft", label: "기안" };
      case "결재중":
        return { className: "approval_status_badge status_progress", label: "결재중" };
      case "승인완료":
        return { className: "approval_status_badge status_approved", label: "승인" };
      default:
        return { className: "approval_status_badge", label: status };
    }
  }

  if (loading) {
    return (
      <div>
        <img src="/loading.png" alt="loading" className="loading" />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="flex flex_column module gap_10">
        <div className="flex gap_10">
          {/* 프로필 카드 */}
          <div className="main_box flex_1">
            <div className="width_100 flex flex_column gap_10 align_center justify_center position_rel">
              <div className="gradient"></div>
              <div className="profile_img"></div>
              <div className="small_title font_700">{myInfo.name}</div>
              <div className="small_text">{myInfo.dept_name}</div>
              <div className="small_text">{myInfo.email}</div>
              <ul className="profile_stats">
                <li>
                  결재처리함<span className="font_700">0</span>
                </li>
                <li>
                  오늘의 일정<span className="font_700">1</span>
                </li>
                <li>
                  채팅<span className="font_700">0</span>
                </li>
              </ul>
            </div>
          </div>

          <CalendarCard />

          <div className="flex flex_column gap_10 flex_1">
            {/* 공지사항 카드 */}
            <div className="main_box notice_card flex_1">
              <div className="card_title font_700">공지사항</div>
              <ul className="notice_list">
                {sortedList.length === 0 ? (
                  <li>리스트가 없습니다.</li>
                ) : (
                  sortedList.map((n) => (
                    <li key={n.post_idx}>
                      <span className="su_small_text">
                        {n.pinned && <strong>[중요]</strong>}
                        {ellipsis(n.subject)}
                      </span>
                      <span className="su_small_text">{formatDate(n.reg_date)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* 내 근태현황 카드 */}
            <div className="main_box attendance_card flex_1">
              <div className="card_title font_700">내 근태현황</div>
              <div className="attendance_chart_wrap">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  {(() => {
                    let acc = 0;
                    const radius = 40;
                    const circ = 2 * Math.PI * radius;
                    return attendanceStats.map((stat) => {
                      const valueRatio = stat.value / totalAttendance;
                      const dash = circ * valueRatio;
                      const offset = circ * acc;
                      acc += valueRatio;
                      return (
                        <circle
                          key={stat.label}
                          cx="45"
                          cy="45"
                          r={radius}
                          fill="none"
                          stroke={stat.color}
                          strokeWidth="10"
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset}
                          style={{ transition: "stroke-dasharray 0.5s" }}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="attendance_legend">
                  {attendanceStats.map((stat) => (
                    <div key={stat.label} className="legend_item">
                      <span className="legend_color" style={{ background: stat.color }} />
                      <span className="legend_label">{stat.label}</span>
                      <span className="legend_value">{stat.value}회</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="attendance_info">
                {todayAttendance.length === 0 ? (
                  <div className="flex gap_20">
                    <p>출근 : -</p>
                    <p>퇴근 : -</p>
                  </div>
                ) : (
                  <div className="flex gap_20">
                    <p>출근 : {getHourAndMinute(earliestInTimeStr)}</p>
                    <p>퇴근 : {getHourAndMinute(latestOutTimeStr)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap_10 flex_1">
          {/* 결재 시스템 카드 */}
          <div className="main_box notice_card flex_1">
            <div className="card_title font_700">결재 시스템</div>
            <ul className="notice_list">
              {approvals.length === 0 ? (
                <li>결재 문서 없음</li>
              ) : (
                approvals
                  .slice()
                  .sort((a, b) => new Date(b.appr_date) - new Date(a.appr_date))
                  .slice(0, 3)
                  .map((doc) => {
                    const { className, label } = getApprovalClassAndLabel(doc.final_status);
                    return (
                      <li
                        key={doc.appr_idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          borderBottom: "1px solid #eef1f6",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            minWidth: 80,
                            color: "#433878",
                            marginRight: 12,
                          }}
                        >
                          [{doc.appr_type}]
                        </span>
                        <span className="su_small_text text_left flex_1">{doc.content}</span>
                        <span className={className}>{label}</span>
                      </li>
                    );
                  })
              )}
            </ul>
          </div>

          {/* 파일 관리 카드 */}
          <div className="main_box notice_card flex_1">
            <div className="card_title font_700">파일 관리</div>
            <ul className="notice_list">
              {cloud.length === 0 ? (
                <li>리스트가 없습니다.</li>
              ) : (
                cloud.map((n) => (
                  <li key={n.file_idx}>
                    <span className="su_small_text">{ellipsis(n.filename)}</span>
                    <span className="su_small_text">{formatDate(n.created_at)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="flex gap_10 flex_1">
          {/* 회의록 카드 */}
          <div className="main_box notice_card flex_1">
            <div className="card_title font_700">회의록</div>
            <ul className="notice_list">
              {filteredList.length === 0 ? (
                <li>리스트가 없습니다.</li>
              ) : (
                filteredList.map((n) => (
                  <li key={n.post_idx}>
                    <span className="su_small_text">{ellipsis(n.subject)}</span>
                    <span className="su_small_text">{formatDate(n.reg_date)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
