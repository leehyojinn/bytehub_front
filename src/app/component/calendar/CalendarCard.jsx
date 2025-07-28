'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Link from 'next/link';
import { useEffect } from 'react';
import axios from 'axios';

const calendarEvents = [
  { id: '1', title: '회의실 예약', date: '24-07-15' },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function CalendarCard() {

      // 서버에서 일정을 불러오는 함수
  const callEvents = async () => {
      let {data} = await axios.get(`${apiUrl}/scd/total`);
      console.log(data);
  }

  useEffect(()=>{
    callEvents();
  },[])

  return (
    <div className="main_box calendar_card flex_1" id='main_calendar'>
      <Link href="/component/calendar">
        <img src="/link.png" alt="link" className="main_link"/>
      </Link>
      <div className="card_title font_700">캘린더</div>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        height="auto"
        events={calendarEvents}
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'prev,next today'
        }}
        dayMaxEvents={2}
      />
        <ul className="calendar_events mt_10">
        {calendarEvents.map(ev => (
            <li key={ev.date} className="su_small_text">
                <span>{ev.date}</span> {ev.title}
            </li>
        ))}
        </ul>    
    </div>
  );
}
