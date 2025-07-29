'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import CalendarCard from "../calendar/CalendarCard";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/app/zustand/store";
import Link from "next/link";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
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
  
  // ISO 문자열을 로컬 시간으로 변환
  const date = new Date(datetimeStr);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return hours + "시 " + minutes + "분";
}
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

  // --------- 실시간 알림(채팅) 상태 ---------
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const [todayScheduleCount, setTodayScheduleCount] = useState(0);

  // 알림 목록 서버에서 불러오기
  const fetchNotifications = async () => {
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) return;
      const response = await axios.get(`${apiUrl}/notification/unread?user_id=${userId}`);
      console.log(response);
      if (response.data.success) {
        setNotifications(response.data.data.filter(d=> d.type == 'CHAT_MESSAGE'));
        setUnreadCount(notifications.length);
      }
    } catch (error) {
      console.error('알림 조회 실패:', error);
    }
  };

  // WebSocket 연결 및 subscribe
  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        subscriptionRef.current = client.subscribe(`/topic/notification/${userId}`, (message) => {
          const notification = JSON.parse(message.body);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          // 필요시 Notification API 호출 가능
        });
      },
      onDisconnect: () => {
        if(subscriptionRef.current){
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // ------- 기존 데이터 및 함수 -------
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
  useEffect(() => { if (myInfo.dept_idx) cloudList(); }, [myInfo.dept_idx]);
  useEffect(() => { if (myInfo.user_id) { fetchApprovals(); attList(); } }, [myInfo.user_id]);

  const today = getCurrentDate();
  const todayAttendance = att.filter((item) => item.att_date === today);
  
  // 출근 시간 계산 (로컬 시간 기준)
  const inTimes = todayAttendance.filter((i) => i.in_time).map((i) => new Date(i.in_time));
  const earliestInTime = inTimes.length > 0 ? new Date(Math.min(...inTimes.map(d => d.getTime()))) : null;
  const earliestInTimeStr = earliestInTime ? earliestInTime.toISOString() : null;
  
  // 퇴근 시간 계산 (로컬 시간 기준)
  const outTimes = todayAttendance.filter((i) => i.out_time).map((i) => new Date(i.out_time));
  const latestOutTime = outTimes.length > 0 ? new Date(Math.max(...outTimes.map(d => d.getTime()))) : null;
  const latestOutTimeStr = latestOutTime ? latestOutTime.toISOString() : null;
  const attendanceCount = getAttendanceStats(att);
  const attendanceStats = [
    { label: "출근", value: attendanceCount.출근, color: "#4f8cff" },
    { label: "연장근무", value: attendanceCount.연장근무, color: "#34c759" },
    { label: "지각/조퇴", value: attendanceCount["지각/조퇴"], color: "#ff3b30" },
    { label: "결석", value: attendanceCount.결석, color: "#ff9500" },
  ];
  const totalAttendance = attendanceStats.reduce((sum, item) => sum + item.value, 0) || 1;
  const sortedList = [
    ...noticeList.filter((n) => n.pinned).sort((a, b) => a.post_idx - b.post_idx),
    ...noticeList.filter((n) => !n.pinned).sort((a, b) => new Date(b.reg_date) - new Date(a.reg_date)),
  ].slice(0, 4);
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
          <div className="main_box flex_1 position_rel">
            <Link href="/component/mypage">
              <img src="/link.png" alt="link" className="main_link" />
            </Link>
            <div className="width_100 flex flex_column gap_10 align_center justify_center position_rel">
              <div className="gradient"></div>
              <div className="profile_img"></div>
              <div className="small_title font_700">{myInfo.name}</div>
              <div className="small_text">{myInfo.dept_name}</div>
              <div className="small_text">{myInfo.email}</div>
              <ul className="profile_stats">
                <li>
                  오늘의 일정<span className="font_700">{todayScheduleCount}</span>
                </li>
                <li>
                  {/* 채팅 + 알림 숫자 링크 */}
                    채팅
                    <Link
                      href="/component/chating"
                      title="채팅방 바로가기"
                    >
                    <span className="font_700">{unreadCount}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <CalendarCard onTodayCountChange={setTodayScheduleCount} />

          <div className="flex flex_column gap_10 flex_1">
            {/* 공지사항 카드 */}
            <div className="main_box notice_card flex_1">
              <Link href="/component/board">
                <img src="/link.png" alt="link" className="main_link" />
              </Link>
              <div className="card_title font_700">공지사항</div>
              <ul className="notice_list">
                {sortedList.length === 0 ? (
                  <li>리스트가 없습니다.</li>
                ) : (
                  sortedList.map((n) => (
                    <Link key={n.post_idx} href={`/component/board/board_detail/${n.post_idx}`}>
                      <li>
                        <span className="su_small_text">
                          {n.pinned && <strong>[중요]</strong>}
                          {ellipsis(n.subject)}
                        </span>
                        <span className="su_small_text">{formatDate(n.reg_date)}</span>
                      </li>
                    </Link>
                  ))
                )}
              </ul>
            </div>
            {/* 내 근태현황 카드 */}
            <div className="main_box attendance_card flex_1">
              <Link href="/component/attendance">
                <img src="/link.png" alt="link" className="main_link" />
              </Link>
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
            <Link href="/component/approval">
              <img src="/link.png" alt="link" className="main_link" />
            </Link>
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
            <Link href="/component/files">
              <img src="/link.png" alt="link" className="main_link" />
            </Link>
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
            <Link href="/component/meeting">
              <img src="/link.png" alt="link" className="main_link" />
            </Link>
            <div className="card_title font_700">회의록</div>
            <ul className="notice_list">
              {filteredList.length === 0 ? (
                <li>리스트가 없습니다.</li>
              ) : (
                filteredList.map((n) => (
                  <Link key={n.post_idx} href={`/component/meeting/meeting_detail/${n.post_idx}`}>
                    <li>
                      <span className="su_small_text">{ellipsis(n.subject)}</span>
                      <span className="su_small_text">{formatDate(n.reg_date)}</span>
                    </li>
                  </Link>
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
