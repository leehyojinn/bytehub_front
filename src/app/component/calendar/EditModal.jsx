'use client'
import React, {useEffect} from "react";

export default function EditModal({setShowEditModal, handleEditEvent, startDate, endDate,
                                      modalTitle, setModalTitle, setEndDate, setStartDate, handleDeleteEvent}) {



    return(
        <div className="modal_overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
                <h3 className="card_title font_700 mb_20">일정 수정</h3>
                <form onSubmit={handleEditEvent} className="flex flex_column gap_10">
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
                        <button type="submit" className="board_btn">수정</button>
                        <button type="button" className="board_btn board_btn_cancel"
                                onClick={() => setShowEditModal(false)}>취소
                        </button>
                        <button type="button" className="board_btn"
                                onClick={handleDeleteEvent}>삭제
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}