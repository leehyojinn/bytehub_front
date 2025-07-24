import React from "react";

export default function InsertModal({setShowModal, handleAddEvent, startDate, endDate,
                         modalTitle, setModalTitle, setEndDate, setStartDate, types, labels}) {

    return(
        <div className="modal_overlay" onClick={() => setShowModal(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
                <h3 className="card_title font_700 mb_20">{labels[types]} 일정 등록</h3>
                <form onSubmit={handleAddEvent} className="flex flex_column gap_10">
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