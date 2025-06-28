'use client';

import Header from "@/app/Header";
import Footer from "@/app/Footer";
import CalendarCard from "../calendar/CalendarCard";

const mails = [
    {
        id: 1,
        title: "휴가신청 승인 안내",
        date: "24-07-01"
    }, {
        id: 2,
        title: "7월 워크샵 일정 공지",
        date: "24-07-02"
    }
];

const notices = [
    {
        id: 1,
        title: "2024년 하계휴가 신청 안내",
        date: "24-06-28"
    }, {
        id: 2,
        title: "전사 시스템 점검 안내",
        date: "24-06-25"
    }
];

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
        label: "휴일근무",
        value: 2,
        color: "#ff9500"
    }, {
        label: "지각/조퇴",
        value: 1,
        color: "#ff3b30"
    }
];

export default function Home() {
    const totalAttendance = attendanceStats.reduce(
        (sum, item) => sum + item.value,
        0
    );

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
                            <div className="small_title font_700">홍길동</div>
                            <div className="small_text">마케팅팀</div>
                            <div className="small_text">honggildong@email.com</div>
                            <ul className="profile_stats">
                                <li>받은 메일함
                                    <span className="font_700">{mails.length}</span>
                                </li>
                                <li>오늘의 일정
                                    <span className="font_700">1</span>
                                </li>
                                <li>대결함
                                    <span className="font_700">0</span>
                                </li>
                                <li>진행함
                                    <span className="font_700">2</span>
                                </li>
                                <li>협조/회람함
                                    <span className="font_700">1</span>
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
                                    notices.map(n => (
                                        <li key={n.id}>
                                            <span className="su_small_text">{n.title}</span>
                                            <span className="su_small_text">{n.date}</span>
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
                                <div>출근: 09:23AM</div>
                                <div>퇴근: -</div>
                                <div>잔여근무: 40h</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap_10 flex_1">
                    <div className="main_box notice_card flex_1">
                        <div className="card_title font_700">결재 시스템</div>
                        <ul className="notice_list">
                            {
                                notices.map(n => (
                                    <li key={n.id}>
                                        <span className="su_small_text">{n.title}</span>
                                        <span className="su_small_text">{n.date}</span>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                    <div className="main_box notice_card flex_1">
                        <div className="card_title font_700">파일 관리</div>
                        <ul className="notice_list">
                            {
                                notices.map(n => (
                                    <li key={n.id}>
                                        <span className="su_small_text">{n.title}</span>
                                        <span className="su_small_text">{n.date}</span>
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
                                notices.map(n => (
                                    <li key={n.id}>
                                        <span className="su_small_text">{n.title}</span>
                                        <span className="su_small_text">{n.date}</span>
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
