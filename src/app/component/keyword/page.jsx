'use client';

import React, { useEffect, useState } from "react";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import axios from "axios";
import { useAlertModalStore } from "@/app/zustand/store";
import {checkAuthStore} from "@/app/zustand/store";
import AlertModal from "../alertmodal/page";

const isActiveStatus = (status) =>
  status === 0 || status === false || status === '0' || status === null;

export default function KeywordManagePage() {
  const [keywords, setKeywords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const getUserId = () => (typeof window !== "undefined" ? sessionStorage.getItem("userId") || "" : "");
  const getSession=()=>(typeof window !== "undefined" ? sessionStorage || "" : ""); //해본다
  const [form, setForm] = useState({ user_id: getUserId(), keyword: "", response: "" });

  const api_url = process.env.NEXT_PUBLIC_API_URL;
  const alertModal = useAlertModalStore();
  const blockId = checkAuthStore();

  // 키워드 목록 불러오기
  async function list() {
    try {
      const { data } = await axios.post(`${api_url}/keyword/list`);
      setKeywords((data.list || []).filter(k => isActiveStatus(k.status)));
    } catch (e) {
      alertModal.openModal({
        msg1: "키워드 목록 불러오기에 실패했습니다.",
        showCancel: false,
      });
    }
  }

  // 키워드 등록
  async function keyword_insert() {
    try {
      const user_id = getUserId();
      const { data } = await axios.post(`${api_url}/keyword/insert`, { ...form, user_id });
      if (data.suc) {
        await list();
        setModalOpen(false);
        setForm({ user_id, keyword: "", response: "" });
        alertModal.openModal({
          msg1: "키워드가 등록되었습니다.",
          showCancel: false,
        });
      } else {
        // 서버에서 중복에 대한 메시지를 내려주는 경우
        if (data.code === 1062 || (data.message && data.message.includes('Duplicate'))) {
          alertModal.openModal({
            msg1: "이미 등록된 키워드입니다.",
            showCancel: false,
          });
        } else {
          alertModal.openModal({
            msg1: data.message || "등록에 실패했습니다.",
            showCancel: false,
          });
        }
      }
    } catch (e) {
      // DB에서 중복 에러가 발생했을 때
      if (
        (e.response && e.response.data && e.response.data.code === 1062) ||
        (e.message && e.message.includes('Duplicate'))
      ) {
        alertModal.openModal({
          msg1: "이미 등록된 키워드입니다.",
          showCancel: false,
        });
      } else {
        alertModal.openModal({
          msg1: "등록 중 오류가 발생했습니다.",
          showCancel: false,
        });
      }
    }
  }

  // 키워드 수정
  async function keyword_update() {
    try {
      const user_id = getUserId();
      const { data } = await axios.post(`${api_url}/keyword/update`, { ...form, user_id });
      if (data.suc) {
        await list();
        setModalOpen(false);
        setForm({ user_id, keyword: "", response: "" });
        alertModal.openModal({
          msg1: "키워드가 수정되었습니다.",
          showCancel: false,
        });
      } else {
        alertModal.openModal({
          msg1: data.message || "수정에 실패했습니다.",
          showCancel: false,
        });
      }
    } catch (e) {
      alertModal.openModal({
        msg1: "수정 중 오류가 발생했습니다.",
        showCancel: false,
      });
    }
  }

  // 키워드 삭제 (status 1로 soft delete)
  async function keyword_delete(key_idx) {
    alertModal.openModal({
      msg1: "정말 삭제하시겠습니까?",
      showCancel: true,
      onConfirm: async () => {
        try {
          const user_id = getUserId();
          const { data } = await axios.post(`${api_url}/keyword/delete`, { key_idx, user_id });
          if (data.suc) {
            await list();
            alertModal.openModal({
              msg1: "삭제되었습니다.",
              showCancel: false,
            });
          } else {
            alertModal.openModal({
              msg1: data.message || "삭제에 실패했습니다.",
              showCancel: false,
            });
          }
        } catch (e) {
          alertModal.openModal({
            msg1: "삭제 중 오류가 발생했습니다.",
            showCancel: false,
          });
        }
      },
      onCancel: () => {},
    });
  }

  // 등록/수정 폼 열기
  const openForm = (kw = null) => {
    const user_id = getUserId();
    if (kw) {
      setEditMode(true);
      setForm({
        key_idx: kw.key_idx,
        user_id: kw.user_id || user_id,
        keyword: kw.keyword || "",
        response: kw.response || ""
      });
    } else {
      setEditMode(false);
      setForm({ user_id, keyword: "", response: "" });
    }
    setModalOpen(true);
  };

  // 등록/수정 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.response.trim()) {
      alertModal.openModal({
        msg1: "키워드와 답변을 입력하세요.",
        showCancel: false,
      });
      return;
    }
    if (editMode) {
      await keyword_update();
    } else {
      await keyword_insert();
    }
  };

  useEffect(() => {
    blockId.redirect({session:sessionStorage, alert:alertModal});
    list();
  }, []);

  return (
    <div>
      <Header />
      <div className="wrap padding_60_0">
        <div className="main_box flex_1 keyword_manage_box">
          <div className="card_title font_700 mb_20">챗봇 키워드 관리</div>
          <div className="flex justify_between align_center mb_20">
            <span className="su_small_text">챗봇에서 사용하는 키워드를 등록·수정·삭제할 수 있습니다.</span>
            <button className="board_btn" onClick={() => openForm()}>+ 키워드 등록</button>
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="keyword_table">
              <thead>
                <tr>
                  <th style={{width: '18%'}}>키워드</th>
                  <th style={{width: '40%'}}>답변</th>
                  <th style={{width: '17%'}}>관리</th>
                </tr>
              </thead>
              <tbody>
              {keywords.length === 0 && (
                <tr>
                  <td colSpan={4} style={{textAlign: 'center', color: '#aaa'}}>등록된 키워드가 없습니다.</td>
                </tr>
              )}
              {keywords.map(kw => (
                <tr key={kw.key_idx}>
                  <td><b>{kw.keyword}</b></td>
                  <td>{kw.response}</td>
                  <td className="keyword_manage_actions">
                    <button className="board_btn board_btn_small" onClick={() => openForm(kw)}>수정</button>
                    <button className="board_btn board_btn_small board_btn_cancel" onClick={() => keyword_delete(kw.key_idx)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {/* 등록/수정 모달 */}
        {modalOpen && (
          <div className="modal_overlay" onClick={() => setModalOpen(false)}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
              <h3 className="card_title font_700 mb_20">{editMode ? "키워드 수정" : "키워드 등록"}</h3>
              <form onSubmit={handleSubmit} className="flex flex_column gap_10">
                <div className="board_write_row">
                  <label className="board_write_label">키워드</label>
                  <input
                    type="text"
                    className="board_write_input"
                    value={form.keyword}
                    onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="board_write_row">
                  <label className="board_write_label">답변</label>
                  <textarea
                    className="board_write_input"
                    value={form.response}
                    onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
                    required
                    rows={3}
                  />
                </div>        
                <div className="modal_buttons">
                  <button type="submit" className="board_btn">{editMode ? "수정" : "등록"}</button>
                  <button type="button" className="board_btn board_btn_cancel" onClick={() => setModalOpen(false)}>취소</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <AlertModal/>
    </div>
  );
}
