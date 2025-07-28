'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import interactionPlugin from '@fullcalendar/interaction';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const typeLabels = {
  company: '회사',
  team: '팀',
  personal: '개인',
  leave: '연차',
  project: '프로젝트',
};

const typeColors = {
  company: "#7c6ee6",
  team: "#43b8c6",
  personal: "#b1b1b1",
  leave: "#ff6f61",
  attendance: "#3db36a",
  project: "#e7a43a",
};

// 오늘 날짜 포맷 생성 함수
const dayfomatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- 새로 추가하는 mappingScd 함수 ---
const mappingScd = ({ scd }) => {
  let eventObj = {
    id: scd.scd_idx,
    title: scd.subject,
    type: scd.scd_type,
    type_idx: scd.type_idx,
  };

  // end_date + 1 해서 일정 끝 날짜 포함 처리
  const endPlusOne = new Date(scd.end_date);
  endPlusOne.setDate(endPlusOne.getDate() + 1);
  const endStr = endPlusOne.toISOString().slice(0, 10);

  if (scd.start_date === scd.end_date) {
    eventObj.date = scd.start_date;
  } else {
    eventObj.start = scd.start_date;
    eventObj.end = endStr;
  }

  switch (scd.scd_type) {
    case "company":
      eventObj.allowed_grades = [1, 2];
      eventObj.visible_to_all = true;
      break;
    case "team":
      eventObj.allowed_grades = [1, 2, 3];
      eventObj.team_id = scd.type_idx;
      eventObj.visible_to_team = true;
      break;
    case "personal":
      eventObj.user_id = scd.user_id;
      break;
    case "project":
      eventObj.team_id = scd.team_id;
      eventObj.user_id = scd.user_id;
      break;
    default:
      console.log(scd.scd_type + "는 알 수 없는 일정 유형입니다.");
      break;
  }

  return eventObj;
};

export default function CalendarCard({ onTodayCountChange }) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayfomatted());
  const [currentUser, setCurrentUser] = useState({ id: null, team_id: null });
  const [userReady, setUserReady] = useState(false);

  const fetchUserInfo = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/mypage/info`, {
        headers: { Authorization: sessionStorage.getItem('token') },
      });
      setCurrentUser({
        id: data.data.user_id,
        team_id: data.data.dept_idx,
      });
    } catch {
      setCurrentUser({ id: null, team_id: null });
    } finally {
      setUserReady(true);
    }
  };

  const mappingLeave = (scd, teamId) => {
    const endPlusOne = new Date(scd.vac_end);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    const endStr = endPlusOne.toISOString().slice(0, 10);

    let eventObj = {
      id: scd.appr_idx || scd.vac_idx || scd.scd_idx || Math.random().toString(),
      title: `${scd.name} : ${scd.subject}`,
      type: 'leave',
      user_id: scd.writer_id,
      team_id: teamId || null,
    };

    if (scd.vac_start === scd.vac_end) {
      eventObj.date = scd.vac_start;
    } else {
      eventObj.start = scd.vac_start;
      eventObj.end = endStr;
    }

    return eventObj;
  };

  const callEvents = async () => {
    if (!currentUser.team_id) {
      setCalendarEvents([]);
      return;
    }
    try {
      const { data } = await axios.get(`${apiUrl}/scd/total`);

      // mappingScd 함수로 일정 데이터 변환 (방어코드 포함)
      const generalEvents = Array.isArray(data.scd_list)
        ? data.scd_list.map(scdItem => mappingScd({ scd: scdItem }))
        : [];

      const leaveRes = await axios.get(`${apiUrl}/leave/team/${currentUser.team_id}`);
      const leaveEvents = Array.isArray(leaveRes.data.list)
        ? leaveRes.data.list.map(item => mappingLeave(item, currentUser.team_id))
        : [];

      setCalendarEvents([...generalEvents, ...leaveEvents]);
    } catch (err) {
      setCalendarEvents([]);
      console.error('일정 불러오기 오류:', err);
    }
  };

  const filterEvents = (events, user) => {
    return events.filter(ev => {
      if (ev.type === 'company') return true;
      if (ev.type === 'team') return ev.team_id === user.team_id;
      if (ev.type === 'personal') return ev.user_id === user.id;
      if (ev.type === 'project') return ev.user_id === user.id;
      if (ev.type === 'leave') return ev.team_id === user.team_id || ev.user_id === user.id;
      return false;
    });
  };

  const filterEventsByDate = (events, date) => {
    return events.filter(ev => {
      if (ev.date === date) return true;
      if (ev.start && ev.end) {
        return date >= ev.start && date < ev.end;
      }
      return false;
    });
  };

  // 컴포넌트 마운트 시 사용자 info fetch
  useEffect(() => {
    fetchUserInfo();
  }, []);

  // userReady, currentUser.team_id 변경 시에만 이벤트 호출
  useEffect(() => {
    if (userReady && currentUser.team_id) {
      callEvents();
    }
  }, [userReady, currentUser.team_id]);

  // fetched events 변경 시 필터링
  useEffect(() => {
    if (currentUser.id && calendarEvents.length > 0) {
      const filtered = filterEvents(calendarEvents, currentUser);
      setFilteredEvents(filtered);
    }
  }, [calendarEvents, currentUser]);

  // FullCalendar에 넘길 포맷팅된 이벤트 배열 생성
  const calendarEventsFormatted = filteredEvents.map(ev => {
    if (ev.start && ev.end) {
      return {
        id: ev.id,
        title: `[${typeLabels[ev.type] || '기타'}] ${ev.title}`,
        start: ev.start,
        end: ev.end,
        allDay: true,
        color: typeColors[ev.type] || '#cccccc',
      };
    }
    return {
      id: ev.id,
      title: `[${typeLabels[ev.type] || '기타'}] ${ev.title}`,
      date: ev.date,
      allDay: true,
      color: typeColors[ev.type] || '#cccccc',
    };
  });

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const countTodayEvents = (events) => {
    return events.filter(ev => {
      if (ev.date === today) return true;
      if (ev.start && ev.end) {
        return today >= ev.start && today < ev.end;
      }
      return false;
    }).length;
  };

  // 오늘 일정 개수 변경 콜백
  useEffect(() => {
    if (onTodayCountChange) {
      const count = countTodayEvents(filteredEvents);
      console.log('오늘 일정 개수:', count);
      onTodayCountChange(count);
    }
  }, [filteredEvents, onTodayCountChange]);

  const selectedDateEvents = filterEventsByDate(filteredEvents, selectedDate);

  return (
    <div className="main_box calendar_card flex_1" id="main_calendar">
      <div className='calendar_scroll'>
        <Link href="/component/calendar">
          <img src="/link.png" alt="link" className="main_link" />
        </Link>
        <div className="card_title font_700">캘린더</div>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          height="auto"
          headerToolbar={{
            left: 'title',
            center: '',
            right: 'prev,next today',
          }}
          dayMaxEvents={2}
          events={calendarEventsFormatted}
          dateClick={info => {
            setSelectedDate(info.dateStr);
          }}
          dayCellClassNames={(arg) => {
            const cellDate = arg.date;
            const yyyy = cellDate.getFullYear();
            const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
            const dd = String(cellDate.getDate()).padStart(2, '0');
            const cellDateStr = `${yyyy}-${mm}-${dd}`;

            return cellDateStr === selectedDate ? ['selected-day'] : [];
          }}
        />
        <div className="mt_10">
          <strong>{selectedDate} 일정</strong>
          <ul className="calendar_events mt_10" style={{ listStyle: 'none', paddingLeft: 0 }}>
            {selectedDateEvents.length === 0 ? (
              <li className="su_small_text">해당 날짜에 일정이 없습니다.</li>
            ) : (
              selectedDateEvents.map(ev => (
                <li
                  className="su_small_text"
                  key={ev.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '6px',
                    gap: '8px',
                    color: typeColors[ev.type] || '#000',
                  }}
                >
                  <span
                    className='su_label_text'
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      backgroundColor: typeColors[ev.type] || '#ccc',
                      borderRadius: '3px',
                    }}
                  />
                  <span className='su_label_text'>[{typeLabels[ev.type] || '기타'}] {ev.title}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
