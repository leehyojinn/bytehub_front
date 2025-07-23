'use client';

import React, {useEffect, useRef, useState} from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;


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
let today = new Date();

// initial events
const calendar_events = [
    {
        // 1일 일정 예시
        id: "c1",
        title: "회사 전체 회의",
        date: "2025-07-03",
        type: "company",
        allowed_grades: ["A"],
        visible_to_all: true
    },
    {
        id: "c2",
        title: "개발팀 스프린트 미팅",
        date: "2025-07-04",
        type: "team",
        team_id: 1,
        allowed_grades: ["A", "B"],
        visible_to_team: true
    },
    {
        id: "c3",
        title: "개인 업무 마감",
        date: "2025-07-05",
        type: "personal",
        user_id: 1
    },
    // 기간 일정 예시
    {
        id: "c4",
        title: "휴가",
        start: "2025-07-10",
        end: "2025-07-13",
        type: "personal",
        user_id: 1
    },
];

function getVisibleEvents(events, user) {
    return events.filter(ev => {
        if (ev.type === "company") return ev.visible_to_all;
        if (ev.type === "team") return ev.team_id === user.team_id && ev.allowed_grades.includes(user.grade);
        if (ev.type === "personal") return ev.user_id === user.id;
        if (ev.type === "project") return ev.user_id === user.id;
        return false;
    });
}

function flattenEventsForCalendar(events) {
    // console.log('flattenEvents?: ', events);
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
        return {    // 1일일정
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

    const [currentUser, setCurrentUser] = useState({});

    const visibleEvents=getVisibleEvents(events, currentUser);
    let calendarData = flattenEventsForCalendar(visibleEvents);
    const todayCount = countTodayEvents(visibleEvents, today);


    const userId = useRef('');
    useEffect(() => {
        if (sessionStorage) {
            userId.current = sessionStorage.getItem('userId');

            callUserInfo().then(() => {
                return callEvents();
            }).then(() => {
                calendarData = flattenEventsForCalendar(visibleEvents);
            });
        }
    }, []);


    const mappingScd=({scd})=>{
        let eventObj={
            id: scd.type_idx,
            title: scd.subject,
            type: scd.scd_type,
        };

        // end date + 1을 해야 끝까지 출력됨
        const endPlusOne = new Date(scd.end_date);
        endPlusOne.setDate(endPlusOne.getDate() + 1);
        const endStr = endPlusOne.toISOString().slice(0, 10);

        if(scd.start_date===scd.end_date){
            eventObj.date=scd.start_date;
        }else{
            eventObj.start=scd.start_date;
            eventObj.end=endStr;
        }
        switch (scd.scd_type) {
            case "company":
                eventObj.allowed_grades=[1, 2];
                eventObj.visible_to_all=true;
                break;
            case "team":
                eventObj.allowed_grades = [1, 2, 3];
                eventObj.team_id = scd.type_idx;
                eventObj.visible_to_team = true;
                break;
            case "personal":
                eventObj.user_id=scd.user_id;
                break;
            case "leave":
                eventObj.team_id=scd.type_idx;  //팀원이 볼수있게?
                eventObj.visible_to_team = true;
                break;
            case "attendance":
                eventObj.user_id=scd.user_id;
                break;
            case "project":
                eventObj.user_id=scd.user_id;
                break;
            default:
                console.log("알 수 없는 일정 유형입니다.");
                break;
        }
        return eventObj;
    }

    // 서버에서 일정을 불러오는 함수
    const callEvents = async () => {
        let {data} = await axios.get(`${apiUrl}/scd/total`);
        const scd_list = data.scd_list.map((item) => {
            return mappingScd({scd: item});
        });
        console.log('events?:', scd_list);
        setEvents(scd_list);
    }

    // 일단 유저정보를 긁어오는 함수
    const callUserInfo = async () => {
        let {data} = await axios.get(`${apiUrl}/mypage/info`, {headers: {Authorization: sessionStorage.getItem('token')}});
        setCurrentUser({
            id: data.data.user_id,
            name: data.data.name,
            team_id: data.data.dept_idx,
            grade: data.data.lv_idx,
            position: data.data.lv_name
        });
    }

    // 입력버튼
    const handleAddPersonalEvent = (e) => {
        e.preventDefault();

        if (!modalTitle.trim() || !startDate) {
            alert('시작날짜와 제목을 입력하세요.');
            return;
        }
        // 단일 일정이면 start==end, 기간 일정이면 다르게
        let eventObj={
            user_id: currentUser.id,
            scd_type: type.current,
            type_idx: 0,    // 0은 임시, subject로 구분
            subject: modalTitle.trim(),
            start_date: startDate,
            end_date: endDate,
        }

        // if (startDate === endDate) {
        //     eventObj = {
        //         id: `p${Date.now()}`,
        //         title: modalTitle.trim(),
        //         date: startDate,
        //         type: "personal",
        //         user_id: currentUser.id
        //     };
        // } else {
        //     // end는 반드시 "마지막날+1"로 넣어야 마지막날까지 표시됨
        //     const endPlusOne = new Date(endDate);
        //     endPlusOne.setDate(endPlusOne.getDate() + 1);
        //     const endStr = endPlusOne.toISOString().slice(0, 10);
        //     eventObj = {
        //         id: `p${Date.now()}`,
        //         title: modalTitle.trim(),
        //         start: startDate,
        //         end: endStr,
        //         type: "personal",
        //         user_id: currentUser.id
        //     };
        // }
        // setEvents(prev => [...prev, eventObj]);  //< 프론트에서 임시로 처리하던 코드
        //insertEvents(eventObj);
        const success = insertEvents(eventObj);
        if (success) {
            // initialize
            setModalTitle('');
            setStartDate(today);
            setEndDate(today);

            setShowModal(false);
            callEvents();
        }else{
            alert('오류가 발생했습니다.');
        }
    };
    const type=useRef('');
    const insertEvents = async (event) => {
        let {data}= await axios.post(`${apiUrl}/scd/insert`, event);
        return data.success;
    }


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
                            {currentUser.grade < 3 ? <button className="caleandar_btn" style={{backgroundColor:typeColors.company}} onClick={() => {
                                type.current='company'
                                setShowModal(true);
                            }}>+ 회사 일정 등록</button>: null}

                            {currentUser.grade < 4 ? <button className="caleandar_btn" style={{backgroundColor:typeColors.team}} onClick={() => {
                                type.current='team'
                                setShowModal(true);
                            }}>+ 팀 일정 등록</button> : null}
                            <button className="caleandar_btn" onClick={() => {
                                type.current='personal'
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
                        // eventClick={(info) => {
                        //     console.log("클릭됨:", info.event.title);  // 작동 확인
                        //     console.log("전체 이벤트 객체:", info.event);
                        //     alert(`이벤트: ${info.event.title}`);
                        // }}
                        //   clickEvents 어쩌구는 globals.css의 fc어쩌구 지워야하는데 어쩌지
                        // 수정어캐해흑흑...
                    />

                    {/* 일정 등록 모달 */}
                    {showModal && (
                        <InsertModal
                            types={type.current}
                            labels={typeLabels}
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



// insert 모달창
function InsertModal({setShowModal, handleAddPersonalEvent, startDate, endDate,
                         modalTitle, setModalTitle, setEndDate, setStartDate, types, labels}) {


    return(
        <div className="modal_overlay" onClick={() => setShowModal(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
                <h3 className="card_title font_700 mb_20">{labels[types]} 일정 등록</h3>
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