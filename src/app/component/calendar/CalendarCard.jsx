'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const calendarEvents = [
  { id: '1', title: '회의실 예약', date: '24-07-15' },
];

export default function CalendarCard() {
  return (
    <div className="main_box calendar_card flex_1" id='main_calendar'>
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
