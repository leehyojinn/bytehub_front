'use client';

import React, {useEffect, useRef, useState} from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const currentUser = {id: 1, name: "홍길동", team_id: 1, grade: "A", position: "팀장"};
const typeColors = {
    company: "#7c6ee6",
    team: "#43b8c6",
    personal: "#b1b1b1",
    leave: "#ff6f61",
    attendance: "#3db36a",
    project: "#e7a43a",
};
const typeLabels = {
    company: "회사",
    team: "팀",
    personal: "개인",
    leave: "연차",
    attendance: "근태",
    project: "프로젝트",
};

// initial today
const today = "2025-07-03";

// initial events
const calendar_events = [
    {id: "c1", title: "회사 전체 회의", date: "2025-07-03", type: "company", allowed_grades: ["A"], visible_to_all: true},
    {
        id: "c2",
        title: "개발팀 스프린트 미팅",
        date: "2025-07-04",
        type: "team",
        team_id: 1,
        allowed_grades: ["A", "B"],
        visible_to_team: true
    },
    {id: "c3", title: "개인 업무 마감", date: "2025-07-05", type: "personal", user_id: 1},
    // 기간 일정 예시
    {id: "c4", title: "휴가", start: "2025-07-10", end: "2025-07-13", type: "personal", user_id: 1},
];

function getVisibleEvents(events, user) {
    return events.filter(ev => {
        if (ev.type === "company") return ev.visible_to_all;
        if (ev.type === "team") return ev.team_id === user.team_id && ev.allowed_grades.includes(user.grade);
        if (ev.type === "personal") return ev.user_id === user.id;
        return false;
    });
}

function flattenEventsForCalendar(events) {
    return events.map(ev => {
        if (ev.start && ev.end) {
            // 기간 일정
            return {
                id: ev.id,
                title: `[${typeLabels[ev.type]}] ${ev.title}`,
                start: ev.start,
                end: ev.end, // end는 마지막날 "다음날"로 넣으면 마지막날까지 표시됨
                color: typeColors[ev.type],
                allDay: true,
                extendedProps: {...ev}
            };
        }
        return {
            id: ev.id,
            title: `[${typeLabels[ev.type]}] ${ev.title}`,
            date: ev.date,
            color: typeColors[ev.type],
            allDay: true,
            extendedProps: {...ev}
        };
    });
}

function countTodayEvents(events, today) {
    return events.filter(ev => {
        if (ev.date === today) return true;
        if (ev.start && ev.end) {
            return today >= ev.start && today < ev.end; // end는 다음날이어야 함!
        }
        return false;
    }).length;
}


export default function CalendarPage() {
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [events, setEvents] = useState(calendar_events);

    const visibleEvents = getVisibleEvents(events, currentUser);
    const calendarData = flattenEventsForCalendar(visibleEvents);
    const todayCount = countTodayEvents(visibleEvents, today);

    const userId = useRef('');
    useEffect(() => {
        if (sessionStorage) {
            userId.current = sessionStorage.getItem('userId');
            // console.log(userId.current+' loaded.');
        }
    }, []);

    // 입력버튼
    const handleAddPersonalEvent = (e) => {
        e.preventDefault();
        if (!modalTitle.trim() || !startDate) {
            alert('시작날짜와 제목을 입력하세요.');
            return;
        }
        // 단일 일정이면 start==end, 기간 일정이면 다르게
        let eventObj;
        if (startDate === endDate) {
            eventObj = {
                id: `p${Date.now()}`,
                title: modalTitle.trim(),
                date: startDate,
                type: "personal",
                user_id: currentUser.id
            };
        } else {
            // end는 반드시 "마지막날+1"로 넣어야 마지막날까지 표시됨
            const endPlusOne = new Date(endDate);
            endPlusOne.setDate(endPlusOne.getDate() + 1);
            const endStr = endPlusOne.toISOString().slice(0, 10);
            eventObj = {
                id: `p${Date.now()}`,
                title: modalTitle.trim(),
                start: startDate,
                end: endStr,
                type: "personal",
                user_id: currentUser.id
            };
        }
        setEvents(prev => [...prev, eventObj]);
        setModalTitle('');
        setStartDate(today);
        setEndDate(today);

        // axios
        inputScd();

        setShowModal(false);

    };


    const inputScd = async () => {
        console.log('events: ', events);
        console.log('startDate: ', startDate);
        console.log('endDate: ', endDate);
        // 하...효진님이두번하래요
        // let {data}= await axios.post(`${apiUrl}/scd/insert/여기에들어가야해`);
    }

    const type=useRef('');


    return (
        <div>
            <Header/>
            <div className="wrap padding_60_0">

                <div className="main_box calendar_card flex_1">
                    <div className="card_title font_700 mb_10">일정관리</div>
                    <div className="flex gap_10 align_center mb_20 justify_between">
                        <div className="flex gap_10 align_center">
                            <span className="su_small_text">오늘 일정</span>
                            <span className="calendar_today_count">{todayCount}건</span>
                        </div>
                        {/*일정등록버튼*/}
                        <div className="flex gap_10 align_center">
                            <button className="caleandar_btn" style={{backgroundColor:typeColors.company}} onClick={() => {
                                type.current='회사'
                                setShowModal(true);
                            }}>+ 회사 일정 등록</button>
                            <button className="caleandar_btn" style={{backgroundColor:typeColors.team}} onClick={() => {
                                type.current='팀'
                                setShowModal(true);
                            }}>+ 팀 일정 등록</button>
                            <button className="caleandar_btn" onClick={() => {
                                type.current='개인'
                                setShowModal(true);
                            }}>+ 개인 일정 등록</button>
                        </div>

                    </div>
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        locale="ko"
                        height="auto"
                        events={calendarData}
                        headerToolbar={{
                            left: 'title',
                            center: '',
                            right: 'prev,next today'
                        }}
                        dayMaxEvents={2}
                    />

                    {/* 일정 등록 모달 */}
                    {showModal && (
                        <InsertModal
                            type={type.current}
                            setShowModal={setShowModal}
                            handleAddPersonalEvent={handleAddPersonalEvent}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            modalTitle={modalTitle}
                            setModalTitle={setModalTitle}
                        />
                    )}
                </div>
            </div>
            <Footer/>
        </div>
    );
}



//
function InsertModal({setShowModal, handleAddPersonalEvent, startDate, endDate,
                         modalTitle, setModalTitle, setEndDate, setStartDate, type}) {

    return(
        <div className="modal_overlay" onClick={() => setShowModal(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
                <h3 className="card_title font_700 mb_20">{type} 일정 등록</h3>
                <form onSubmit={handleAddPersonalEvent} className="flex flex_column gap_10">
                    <div className="board_write_row">
                        <label htmlFor="event_start" className="board_write_label">시작날짜</label>
                        <input
                            id="event_start"
                            type="date"
                            className="board_write_input"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="board_write_row">
                        <label htmlFor="event_end" className="board_write_label">끝날짜</label>
                        <input
                            id="event_end"
                            type="date"
                            className="board_write_input"
                            value={endDate}
                            min={startDate}
                            onChange={e => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="board_write_row">
                        <label htmlFor="event_title" className="board_write_label">일정 제목</label>
                        <input
                            id="event_title"
                            type="text"
                            className="board_write_input"
                            value={modalTitle}
                            onChange={e => setModalTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="modal_buttons">
                        <button type="submit" className="board_btn">등록</button>
                        <button type="button" className="board_btn board_btn_cancel"
                                onClick={() => setShowModal(false)}>취소
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}