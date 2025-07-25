'use client';

import React, {useEffect, useMemo, useRef, useState} from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import axios from "axios";
import InsertModal from "@/app/component/calendar/InsertModal";
import EditModal from "@/app/component/calendar/EditModal";

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
    project: "프로젝트",
};
// initial today
let today = '2025-07-24';

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
        if (ev.type === 'leave') return ev.id === user.team_id;
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
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [events, setEvents] = useState(calendar_events);
    const type = useRef('');  // 지금 선택한 놈이 팀이냐...회사냐...개인이냐

    // useMemo 병나발쇼
    const [currentUser, setCurrentUser] = useState({});
    const visibleEvents = useMemo(() => {
        if (!currentUser.id) return [];
        return getVisibleEvents(events, currentUser);
    }, [events, currentUser]);
    const calendarData = useMemo(() => {
        return flattenEventsForCalendar(visibleEvents);
    }, [visibleEvents]);
    const todayCount = countTodayEvents(visibleEvents, today);
    const beforeEvent = useRef({});


    useEffect(() => {
        if (showModal) {
            initiallize();
        }
    }, [showModal]);

    useEffect(() => {
        if (currentUser.id) callEvents();
    }, [currentUser]);

    const userId = useRef('');
    useEffect(() => {
        if (sessionStorage) {
            userId.current = sessionStorage.getItem('userId');
        }
        callUserInfo().then(async () => {
            await callEvents();
        })
    }, []);


    // 일정 가져올때 쓰는 매핑함수
    const mappingScd = ({scd}) => {

        let eventObj = {
            id: scd.scd_idx,
            title: scd.subject,
            type: scd.scd_type,
            type_idx: scd.type_idx
        };

        // end date + 1을 해야 끝까지 출력됨
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
                eventObj.user_id = scd.user_id;
                break;
            default:
                console.log(scd.scd_type + "는 알 수 없는 일정 유형입니다.");
                break;
        }
        return eventObj;
    }

    // 연차전용매핑함수(살려줘...)
    const mappingLeave = ({scd}) => {
        let eventObj = {
            id: currentUser.team_id,
            user_id: scd.writer_id,
            title: scd.name+' : '+scd.subject,
            type: 'leave',
            type_idx: scd.appr_idx
        };

        // end date + 1을 해야 끝까지 출력됨
        const endPlusOne = new Date(scd.vac_end);
        endPlusOne.setDate(endPlusOne.getDate() + 1);
        const endStr = endPlusOne.toISOString().slice(0, 10);

        if (scd.vac_start === scd.vac_end) {
            eventObj.date = scd.vac_start;
        } else {
            eventObj.start = scd.vac_start;
            eventObj.end = endStr;
        }
        return eventObj;
    }


    // 서버에서 일정을 불러오는 함수
    const callEvents = async () => {
        let {data} = await axios.get(`${apiUrl}/scd/total`);
        const scd_list = data.scd_list.map((item) => {
            return mappingScd({scd: item});
        });
        setEvents(scd_list);
        await callLeaves(currentUser.team_id);
    }
    // 일정+연차 어캐든 합치는 함수
    const callLeaves = async () => {
        // 으윽 트라이캐치 쓰기싫어
        try{
            let {data} = await axios.get(`${apiUrl}/leave/team/${currentUser.team_id}`);
            const team_leave_list = data.list.map((item) => {
                return mappingLeave({scd: item});
            });
            setEvents((prev) => [...prev, ...team_leave_list]);
        }catch (error) {
            console.log('UserInfo loading…')
        }
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

    // 일정 1개의 정보를 불러오는 함수(수정할때 사용)
    const parseEvent = (info) => {
        beforeEvent.current = {
            scd_idx: info.event._def.extendedProps.id,
            user_id: currentUser.id,
            scd_type: info.event._def.extendedProps.type,
            type_idx: info.event._def.extendedProps.type_idx,
            subject: info.event._def.extendedProps.title,
            start_date: info.event._def.extendedProps.start,
            end_date: info.event._def.extendedProps.end,
        }

        // console.log('parseEvent?: ', beforeEvent.current);

        setModalTitle(beforeEvent.current.subject);
        setStartDate(beforeEvent.current.start_date);
        setEndDate(beforeEvent.current.end_date);

        if (!(beforeEvent.current.scd_type === 'project' || beforeEvent.current.scd_type === 'leave')) {
            setShowEditModal(true);
        }
    }

    // 입력버튼
    const handleAddEvent = (e) => {
        e.preventDefault();

        if (!modalTitle.trim() || !startDate) {
            alert('시작날짜와 제목을 입력하세요.');
            return;
        }
        // 단일 일정이면 start==end, 기간 일정이면 다르게
        let eventObj = {
            user_id: currentUser.id,
            scd_type: type.current,
            type_idx: type.current === 'team' ? currentUser.team_id : 0,    // leave, project의 경우 따로 들어감(수정도 마찬가지)
            subject: modalTitle.trim(),
            start_date: startDate,
            end_date: endDate,
        }

        axios.post(`${apiUrl}/scd/insert`, eventObj).then(({data}) => {
            if (data.success) {
                setShowModal(false);
                initiallize();
                callEvents();
                // location.reload();
            } else {
                alert('오류가 발생했습니다...(생성)');
            }
        })
    };


    // 수정
    const handleEditEvent = (e) => {
        e.preventDefault();

        if (!modalTitle.trim() || !startDate) {
            alert('시작날짜와 제목을 입력하세요.');
            return;
        }
        // 단일 일정이면 start==end, 기간 일정이면 다르게
        let eventObj = {
            scd_idx: beforeEvent.current.scd_idx,
            subject: modalTitle.trim(),
            start_date: startDate,
            end_date: endDate,
        }

        axios.post(`${apiUrl}/scd/edit`, eventObj).then(({data}) => {
            // console.log('들어간 값: ', eventObj);
            if (data.success) {
                initiallize();
                callEvents();
                setShowEditModal(false);
                // location.reload();
            } else {
                alert('오류가 발생했습니다...(수정)');
            }
        })
    };

    //삭제
    const handleDeleteEvent = (e) => {
        e.preventDefault();
        axios.get(`${apiUrl}/scd/del/${beforeEvent.current.scd_idx}`).then(({data}) => {
            if (data.success) {
                alert('삭제되었습니다.');
                initiallize();
                callEvents();
                setShowEditModal(false);
            }
        });
    }

    // 초기화함수(ㅋㅋ...)
    const initiallize = () => {
        setModalTitle('');
        setStartDate(today);
        setEndDate(today);
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
                            {currentUser.grade < 3 ?
                                <button className="caleandar_btn" style={{backgroundColor: typeColors.company}}
                                        onClick={() => {
                                            type.current = 'company'
                                            setShowModal(true);
                                        }}>+ 회사 일정 등록</button> : null}

                            {currentUser.grade < 4 ?
                                <button className="caleandar_btn" style={{backgroundColor: typeColors.team}}
                                        onClick={() => {
                                            type.current = 'team'
                                            setShowModal(true);
                                        }}>+ 팀 일정 등록</button> : null}
                            <button className="caleandar_btn" onClick={() => {
                                type.current = 'personal'
                                setShowModal(true);
                            }}>+ 개인 일정 등록
                            </button>
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
                        eventClick={(info) => {
                            parseEvent(info);
                        }}
                    />

                    {/* 일정 등록 모달 */}
                    {showModal && (
                        <InsertModal
                            types={type.current}
                            labels={typeLabels}
                            setShowModal={setShowModal}
                            handleAddEvent={handleAddEvent}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            modalTitle={modalTitle}
                            setModalTitle={setModalTitle}
                        />
                    )}
                    {showEditModal && (
                        <EditModal
                            showEditModal={showEditModal}
                            setShowEditModal={setShowEditModal}
                            types={type.current}
                            labels={typeLabels}
                            setShowModal={setShowModal}
                            handleEditEvent={handleEditEvent}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            modalTitle={modalTitle}
                            setModalTitle={setModalTitle}
                            handleDeleteEvent={handleDeleteEvent}
                        />
                    )}

                </div>
            </div>
            <Footer/>
        </div>
    );
}
