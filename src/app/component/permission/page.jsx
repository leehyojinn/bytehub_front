'use client';

import AdminPaeneol from "@/app/component/adminpaeneol/AdminPaeneol";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import {useEffect, useRef, useState} from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const initialMembers = [
    {
        user_id: "hong123",
        name: "홍길동",
        gender: "남",
        dept_name: "개발팀",
        lv_name: "팀장",
        email: "hong@bytehub.com",
        hire_date: "2022-01-01",
        withdraw: "X",
    },
];

const PERMISSIONS = [
    {code: "board", label: "회의록 확인"},
    {code: "chat", label: "채팅 채널 개설"},
    {code: "project", label: "프로젝트 생성"},
    {code: "leave", label: "연차 정보 확인"},
    {code: "attendance", label: "근태 정보 확인"},
    {code: "paeneol", label:"관리 패널 접근"}
];

function PermissionModal({open, onClose, member, setUserPermissions, userPermissions, onChange, onSave}) {
    useEffect(() => {
        if (open && member) {
            callAuth();
        }
    }, [member, open]);

    const callAuth = async () => {

        let {data}=await axios.get(`${apiUrl}/auth/grant/${member.user_id}`);
        let arr=['','','','','',''];

        data.auth_list.forEach(item => {
            if (item.access_idx === 0) {
                switch (item.access_type) {     //access_type= 'leave', 'attendance', 'project', 'chat', 'board', 'pannel'
                    case 'leave':
                        arr[3]=PERMISSIONS[3].code;
                        break;
                    case 'attendance':
                        arr[4]=PERMISSIONS[4].code;
                        break;
                    case 'project':
                        arr[2]=PERMISSIONS[2].code;
                        break;
                    case 'chat':
                        arr[1]=PERMISSIONS[1].code;
                        break;
                    case 'board':
                        arr[0]=PERMISSIONS[0].code;
                        break;
                    case 'paeneol':
                        arr[5]=PERMISSIONS[5].code;
                        break;
                    default:
                        break;
                }
            }
        });
        setUserPermissions(arr);
    }


    if (!open || !member) return null;

    return (
        <div className="modal_overlay" tabIndex={-1} onClick={onClose}>
            <div className="modal_content" onClick={e => e.stopPropagation()}>
                <h3 className="card_title font_700 mb_20">{member.name} ({member.user_id}) 권한 관리</h3>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        onSave();
                    }}
                    className="flex flex_column gap_14"
                >
                    <div className="grid_permission mb_20">
                        {PERMISSIONS.map(perm => (
                            <label key={perm.code} className="custom-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={userPermissions.includes(perm.code)}
                                    onChange={() => onChange(perm.code)}
                                    className="custom-checkbox"
                                />
                                <span className="custom-checkbox-span"></span>
                                {perm.label}
                            </label>
                        ))}
                    </div>
                    <div className="modal_buttons">
                        <button type="submit" className="board_btn">저장</button>
                        <button type="button" className="board_btn board_btn_cancel" onClick={onClose}>닫기</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function GrantUser() {
    const [members, setMembers] = useState(initialMembers);
    const [userPermissions, setUserPermissions] = useState(
        Object.fromEntries(initialMembers.map(m => [m.user_id, []]))
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editPerm, setEditPerm] = useState([]);


    //초기
    useEffect(() => {
        callMember();
    }, [])

    useEffect(() => {
        if(selectedMember) {
            arr.current=authList(selectedMember.user_id);
            mapping();
        }
    }, [editPerm, selectedMember]);



    const mapping = () => {
        if (!selectedMember) return;
        arr.current = authList(selectedMember.user_id).map(item => ({
            ...item,
            checked: editPerm.includes(item.access_type)
        }));
    }

    //  더 똑똑하게 할방법이 있을 것 같다...
    const toggleWithDraw = async (id) => {
        let {data} = await axios.get(`${apiUrl}/admin/withdraw/${id}`);
        if (data.success) {
            callMember();
        }
    }

    // 각 member 별 perm 기본값
    const arr = useRef([]);
    const authList = (id) => [
        {user_id: id, access_type: PERMISSIONS[0].code, access_idx: 0, auth: "r", checked: false},
        {user_id: id, access_type: PERMISSIONS[1].code, access_idx: 0, auth: "w", checked: false},
        {user_id: id, access_type: PERMISSIONS[2].code, access_idx: 0, auth: "w", checked: false},
        {user_id: id, access_type: PERMISSIONS[3].code, access_idx: 0, auth: "r", checked: false},
        {user_id: id, access_type: PERMISSIONS[4].code, access_idx: 0, auth: "r", checked: false},
        {user_id: id, access_type: PERMISSIONS[5].code, access_idx: 0, auth: "r", checked: false},
    ];

    // members 불러오기
    const callMember = async () => {
        let {data} = await axios.get(`${apiUrl}/admin/memberList`);

        const list = data.member_list.map((item) => {
            return {
                user_id: item.user_id,
                name: item.name,
                gender: item.gender === 'M' ? "남" : "여",
                dept_name: item.dept_name,
                lv_name: item.lv_name,
                email: item.email,
                hire_date: item.hire_date,
                withdraw: <input
                    type="checkbox"
                    checked={item.withdraw}
                    onChange={(e) => {
                        toggleWithDraw(item.user_id)
                    }}
                    className="custom-checkbox"
                />,
            };
        });
        setMembers(list);
    }

    const openModal = (member) => {
        setSelectedMember(member);
        setEditPerm(userPermissions[member.user_id] || []);
        setModalOpen(true);
    };

    const togglePermission = (perm_code) => {
        setEditPerm(prev =>
            prev.includes(perm_code)
                ? prev.filter(p => p !== perm_code)
                : [...prev, perm_code]
        );
    };


    const handleSave = async () => {
        setUserPermissions(prev => ({
            ...prev,
            [selectedMember.user_id]: editPerm
        }));

        let {data}= await axios.post(`${apiUrl}/auth/grant`, arr.current);
        if(data.success){
            setModalOpen(false);
        }
        else{
            alert('오류가 발생했습니다!');
        }

    };

    return (
        <div>
            <AdminPaeneol/>
            <Header/>
            <div className="wrap padding_60_0">
                <div className="main_box">
                    <div className="card_title font_700 mb_20">직원 권한 관리</div>
                    <table className="custom_permission_table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>이름</th>
                            <th>성별</th>
                            <th>부서</th>
                            <th>직급</th>
                            <th>이메일</th>
                            <th>입사일</th>
                            <th>퇴사</th>
                            <th>권한 관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{textAlign: "center", color: "#aaa"}}>직원 정보가 없습니다.</td>
                            </tr>
                        )}
                        {members.map(item => (
                            <tr key={item.user_id} id={item.user_id}>
                                <td className="board_title">{item.user_id}</td>
                                <td>{item.name}</td>
                                <td>{item.gender}</td>
                                <td>{item.dept_name}</td>
                                <td>{item.lv_name}</td>
                                <td>{item.email}</td>
                                <td>{item.hire_date}</td>
                                <td>{item.withdraw}</td>
                                <td>
                                    <button
                                        className="board_btn board_btn_small"
                                        onClick={() => openModal(item)}
                                    >
                                        권한 관리
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <PermissionModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    member={selectedMember}
                    userPermissions={editPerm}
                    setUserPermissions={setEditPerm}
                    onChange={togglePermission}
                    onSave={handleSave}
                />
            </div>
            <Footer/>

        </div>
    );
}
