'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import CalendarCard from "../calendar/CalendarCard";
import axios from "axios";
import {useEffect} from "react";
import {useAppStore} from "@/app/zustand/store";
import { CONFIG_FILES } from "next/dist/shared/lib/constants";

const attendanceStats = [
    {
        label: "정상근무",
        value: 18,
        color: "#4f8cff"
    }, {
        label: "연장근무",
        value: 6,
        color: "#34c759"
    }, {
        label: "지각/조퇴",
        value: 1,
        color: "#ff3b30"
    }
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const MAX_LENGTH = 15;

function ellipsis(str, maxLength = MAX_LENGTH) {
    if (!str) 
        return '';
    return str.length > maxLength
        ? str.slice(0, maxLength) + '...'
        : str;
}

function formatDate(dateString) {
    return dateString
        ?.slice(0, 10);
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
        setLoading
    } = useAppStore();

    // 근태 합계
    const totalAttendance = attendanceStats.reduce(
        (sum, item) => sum + item.value,
        0
    );

    // 내 정보 가져오기
    async function myInfoList() {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        let {data} = await axios.get(`${apiUrl}/mypage/info`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        setMyInfo(data.data);
        setLoading(false);
    }

    // 게시판 리스트
    async function boardList() {
        setLoading(true);
        let {data} = await axios.post(`${apiUrl}/board/allList`);
        setMeetingList(data.list.filter(d => d.category === "MEETING"));
        setNoticeList(data.list.filter(d => d.category === "NOTICE"));
        setLoading(false);
    }

    // 클라우드 목록
    async function cloudList() {
        if (!myInfo.dept_idx) 
            return;
        try {
            setLoading(true);
            let {data} = await axios.get(`${apiUrl}/cloud/list`, {
                params: {
                    deptIdx: myInfo.dept_idx
                }
            });
            if (data.success) {
                setCloud(data.data);
            }
            setLoading(false);
        } catch (error) {
            alert("오류발생")            
        }
    }

    // 데이터 마운트 후 fetch
    useEffect(() => {
        boardList();
        myInfoList();
    }, []);

    // myInfo.dept_idx 있을 때 클라우드 목록도 가져오기
    useEffect(() => {
        if (myInfo.dept_idx) {
            cloudList();
        }
    }, [myInfo.dept_idx]);

    // 결재 문서 조회
    async function fetchApprovals() {
        if (!myInfo.user_id) 
            return;
        setLoading(true);
        try {
            const {data} = await axios.get(`${apiUrl}/appr/all`, {
                params: {
                    user_id: myInfo.user_id
                }
            });
            if (data.success) {
                setApprovals(data.data);
                console.log(data);
            }
        } catch (e) {
            console.error("결재 문서 조회 실패:", e);
            setApprovals([]); // 실패 시 빈 배열 등
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (myInfo.user_id) {
            fetchApprovals();
            attList();
        }
    }, [myInfo.user_id]);

    // 공지 정렬
    const sortedList = [
        ...noticeList
            .filter(n => n.pinned)
            .sort((a, b) => a.post_idx - b.post_idx),
        ...noticeList
            .filter(n => !n.pinned)
            .sort((a, b) => new Date(b.reg_date) - new Date(a.reg_date))
    ].slice(0, 5);

    // 회의록 필터링
    const filteredList = meetingList
        .filter(
            n => (n.attendees && n.attendees.includes(myInfo.name)) || n.user_id === myInfo.user_id
        )
        .sort((a, b) => new Date(b.reg_date) - new Date(a.reg_date))
        .slice(0, 5);

    function getApprovalClassAndLabel(status) {
        switch (status) {
            case '반려':
                return {className: 'approval_status_badge status_rejected', label: '반려'};
            case '기안':
                return {className: 'approval_status_badge status_draft', label: '기안'};
            case '결재중':
                return {className: 'approval_status_badge status_progress', label: '결재중'};
            case '승인완료':
                return {className: 'approval_status_badge status_approved', label: '승인'};
            default:
                return {className: 'approval_status_badge', label: status};
        }
    }

    async function attList() {
        if (!myInfo.user_id) 
            return;
        setLoading(true);
        let {data} = await axios.get(`${apiUrl}/attendance/list`,{
            params : {
                user_id : myInfo.user_id
            }
        });
        if(data.success){
            setAtt(data.data);
        }
        setLoading(false);
    }

    function getHourAndMinute(datetimeStr) {
        return datetimeStr
        ?.slice(11, 13) + "시 " + datetimeStr?.slice(14,16)+"분";
    }

    function getCurrentDate() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const todayAtt = att.filter(j => j.att_date == getCurrentDate());


    // 로딩 중 표시
    if (loading) {
        return <div>
            <img src="/loading.png" alt="loading" className="loading"/>
        </div>;
    }

    // 본문 렌더링
    return (
        <div>
            <Header/>
            <div className="flex flex_column flex_1 module gap_10">
                <div className="flex gap_10">
                    {/* 프로필 카드 */}
                    <div className="main_box flex_1">
                        <div
                            className="width_100 flex flex_column gap_10 align_center justify_center position_rel">
                            <div className="gradient"></div>
                            <div className="profile_img"></div>
                            <div className="small_title font_700">{myInfo.name}</div>
                            <div className="small_text">{myInfo.dept_name}</div>
                            <div className="small_text">{myInfo.email}</div>
                            <ul className="profile_stats">
                                <li>결재처리함<span className="font_700">0</span>
                                </li>
                                <li>오늘의 일정<span className="font_700">1</span>
                                </li>
                                <li>채팅<span className="font_700">0</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <CalendarCard/>
                    <div className="flex flex_column gap_10 flex_1">
                        {/* 공지사항 카드 */}
                        <div className="main_box notice_card flex_1">
                            <div className="card_title font_700">공지사항</div>
                            <ul className="notice_list">
                                {
                                    sortedList.map(n => (
                                        <li key={n.post_idx}>
                                            <span className="su_small_text">{n.pinned && <strong>[중요]</strong>}
                                                {ellipsis(n.subject)}</span>
                                            <span className="su_small_text">{formatDate(n.reg_date)}</span>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>

                        <div className="main_box attendance_card flex_1">
                            <div className="card_title font_700">내 근태현황</div>
                            <div className="attendance_chart_wrap">
                                <svg width="90" height="90" viewBox="0 0 90 90">
                                    {
                                        (() => {
                                            let acc = 0;
                                            return attendanceStats.map((stat, i) => {
                                                const radius = 40;
                                                const circ = 2 * Math.PI * radius;
                                                const value = stat.value / totalAttendance;
                                                const dash = circ * value;
                                                const offset = circ * acc;
                                                acc += value;
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
                                                        style={{
                                                            transition: 'stroke-dasharray 0.5s'
                                                        }}/>
                                                );
                                            });
                                        })()
                                    }
                                </svg>
                                <div className="attendance_legend">
                                    {
                                        attendanceStats.map(stat => (
                                            <div key={stat.label} className="legend_item">
                                                <span
                                                    className="legend_color"
                                                    style={{
                                                        background: stat.color
                                                    }}></span>
                                                <span className="legend_label">{stat.label}</span>
                                                <span className="legend_value">{stat.value}h</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="attendance_info">
                                {att.filter(j=> j.att_date == getCurrentDate()).length == 0 ? 
                                <div className="flex gap_20">
                                    <p>출근 : -</p>
                                    <p>퇴근 : -</p>
                                </div> : 
                                <div className="flex gap_20">
                                    <p>출근 : {getHourAndMinute(todayAtt[0].in_time)}</p>
                                    <p>퇴근 : {getHourAndMinute(todayAtt[1].out_time)}</p>
                                </div>
                                }
                                
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap_10 flex_1">
                    <div className="main_box notice_card flex_1">
                        <div className="card_title font_700">결재 시스템</div>
                        <ul className="notice_list">
                            {
                                approvals.length === 0
                                    ? (<li>결재 문서 없음</li>)
                                    : ( approvals
                                        .slice()
                                        .sort((a, b) => new Date(b.appr_date) - new Date(a.appr_date)) // 최신순 정렬
                                        .slice(0, 3)
                                        .map((doc) => {
                                        const {className, label} = getApprovalClassAndLabel(doc.final_status);
                                        return (
                                            <li
                                                key={doc.appr_idx}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    borderBottom: "1px solid #eef1f6",
                                                }}>
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        minWidth: 80,
                                                        color: "#433878",
                                                        marginRight: 12
                                                    }}>
                                                    [{doc.appr_type}]
                                                </span>
                                                <span className="su_small_text text_left flex_1">
                                                    {doc.content}
                                                </span>
                                                <span className={className}>{label}</span>
                                            </li>
                                        );
                                    }))
                            }
                        </ul>
                    </div>
                    <div className="main_box notice_card flex_1">
                        <div className="card_title font_700">파일 관리</div>
                        <ul className="notice_list">
                            {
                                cloud.length === 0
                                    ? <li>리스트가 없습니다.</li>
                                    : cloud.map(n => (
                                        <li key={n.file_idx}>
                                            <span className="su_small_text">{ellipsis(n.filename)}</span>
                                            <span className="su_small_text">{formatDate(n.created_at)}</span>
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>
                </div>
                <div className="flex gap_10 flex_1">
                    <div className="main_box notice_card flex_1">
                        <div className="card_title font_700">회의록</div>
                        <ul className="notice_list">
                            {
                                filteredList.length === 0
                                    ? <li>리스트가 없습니다.</li>
                                    : filteredList.map(n => (
                                        <li key={n.post_idx}>
                                            <span className="su_small_text">{ellipsis(n.subject)}</span>
                                            <span className="su_small_text">{formatDate(n.reg_date)}</span>
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    );
}
