'use client'

import AdminPaeneol from "@/app/component/adminpaeneol/AdminPaeneol";
import Header from "@/app/Header";
import {useEffect, useState} from "react";
import axios from "axios";

export default function GrantUser() {

    const [members, setMembers] = useState();

    useEffect(() => {
        drawMember();
    }, []);

    const drawMember = async () => {
        let {data} = await axios.get(`http://localhost/admin/memberList`);
        const list = data.member_list.map((item) => {
            console.log(item);
            return (
                <tr>
                    <td className={"board_title"}>{item.user_id}</td>
                    <td>{item.name}</td>
                    <td>{item.gender}</td>
                    <td>{item.dept_name}</td>
                    <td>{item.lv_name}</td>
                    <td>{item.email}</td>
                    <td>{item.hire_date}</td>
                    <td>{item.withdraw}</td>
                </tr>
            );
        });
        setMembers(list);
    }

    return (
        <div>
            <AdminPaeneol/>
            <Header/>
            <div className={"main_box"}>
                permission(식별)
                <table className={"board_table"}>
                    <thead>
                    <tr>
                        <th className={"small_text"}>ID</th>
                        <th className={"small_text"}>이름</th>
                        <th className={"small_text"}>성별</th>
                        <th className={"small_text"}>부서</th>
                        <th className={"small_text"}>직급</th>
                        <th className={"small_text"}>이메일</th>
                        <th className={"small_text"}>입사일</th>
                        <th className={"small_text"}>퇴사</th>
                    </tr>
                    </thead>
                    <tbody>
                    {members}
                    </tbody>
                </table>
            </div>
        </div>
    );
}