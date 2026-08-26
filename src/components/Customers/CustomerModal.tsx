import React, { useState, useEffect } from 'react';
import { Customer, CustomerStage } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Building, Phone, Mail, MapPin, User, FileText, AlertCircle } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const { currentUser, users, addCustomer, updateCustomer } = useApp();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [stage, setStage] = useState<CustomerStage>('new');
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [expectedValue, setExpectedValue] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Sales list for assignment
  const salesUsers = users.filter((u) => u.role === 'sales_c2' && u.status === 'active');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setCompany(customerToEdit.company || '');
      setPhone(customerToEdit.phone);
      setEmail(customerToEdit.email);
      setAddress(customerToEdit.address || '');
      setTaxCode(customerToEdit.taxCode || '');
      setStage(customerToEdit.stage);
      setAssignedToId(customerToEdit.assignedToId);
      setExpectedValue(customerToEdit.expectedValue || 0);
      setNotes(customerToEdit.notes || '');
      setRejectReason(customerToEdit.rejectReason || '');
    } else {
      setName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxCode('');
      setStage('new');
      setAssignedToId(currentUser.role === 'sales_c2' ? currentUser.id : salesUsers[0]?.id || currentUser.id);
      setExpectedValue(0);
      setNotes('');
      setRejectReason('');
    }
  }, [customerToEdit, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Vui lòng nhập tên khách hàng và số điện thoại liên hệ');
      return;
    }

    const assignedUser = users.find((u) => u.id === assignedToId);
    const assignedToName = assignedUser ? assignedUser.name : currentUser.name;

    if (customerToEdit) {
      updateCustomer({
        ...customerToEdit,
        name,
        company,
        phone,
        email,
        address,
        taxCode,
        stage,
        assignedToId,
        assignedToName,
        expectedValue: Number(expectedValue) || 0,
        notes,
        rejectReason: stage === 'rejected' ? rejectReason : undefined,
      });
    } else {
      addCustomer({
        name,
        company,
        phone,
        email,
        address,
        taxCode,
        stage,
        assignedToId,
        assignedToName,
        createdBy: currentUser.id,
        expectedValue: Number(expectedValue) || 0,
        notes,
        rejectReason: stage === 'rejected' ? rejectReason : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {customerToEdit ? 'Chỉnh Sửa Thông Tin Khách Hàng' : 'Tạo Mới Khách Hàng Tiềm Năng'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Giai đoạn bắt đầu từ Tạo Mới → Đang Báo Giá → Ký HĐ hoặc Từ Chối
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Khách Hàng / Người Liên Hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="VD: KTS. Nguyễn Đình Khoa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Điện Thoại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="VD: 0908 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Công Ty / Đơn Vị (Nếu có)
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="VD: Công ty CP Kiến Trúc Aplus"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  placeholder="VD: khoa.aplus@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Số Thuế (Dành cho Hợp Đồng)
              </label>
              <input
                type="text"
                placeholder="VD: 0315894120"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giá Trị Dự Kiến (VNĐ)
              </label>
              <input
                type="number"
                placeholder="VD: 150000000"
                value={expectedValue || ''}
                onChange={(e) => setExpectedValue(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa Chỉ Giao Hàng / Dự Án
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="VD: Biệt thự Chateau, Đô Thị Phú Mỹ Hưng, Quận 7, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giai Đoạn Khách Hàng
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CustomerStage)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
              >
                <option value="new">1. Tạo Mới (Khách tiềm năng mới)</option>
                <option value="contacted">2. Đang Tiếp Cận & Khảo Sát</option>
                <option value="quoting">3. Đang Báo Giá & Đàm Phán</option>
                <option value="contract_signed">4. Chốt - Ký Hợp Đồng</option>
                <option value="rejected">5. Từ Chối / Thất Bại</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhân Viên Phụ Trách (Cấp 2)
              </label>
              {currentUser.role === 'super_admin' || currentUser.role === 'manager_c1' ? (
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                >
                  {users
                    .filter((u) => {
                      if (u.id === currentUser.id) return true;
                      if (u.role === 'sales_c2') {
                        if (currentUser.role === 'super_admin') return true;
                        if (currentUser.role === 'manager_c1') {
                          return u.managerId === currentUser.id || u.createdBy === currentUser.id;
                        }
                      }
                      return false;
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'manager_c1' ? 'Chính bạn (C1)' : 'Sales C2'})
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (Chính bạn)`}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 bg-slate-100 rounded text-slate-600"
                />
              )}
            </div>
          </div>

          {/* If Stage is Rejected -> Must input reason */}
          {stage === 'rejected' && (
            <div className="p-2.5 bg-rose-50 rounded border border-rose-200">
              <label className="block text-xs font-bold text-rose-900 mb-1 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                Lý Do Khách Hàng Từ Chối (Bắt buộc)
              </label>
              <textarea
                rows={2}
                required
                placeholder="VD: Giá cao hơn đối thủ 15%, chủ nhà hoãn thi công sang năm sau, chọn phương án tự mua lẻ..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 outline-hidden bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi Chú Nhu Cầu & Tiến Độ
            </label>
            <textarea
              rows={2}
              placeholder="VD: Quan tâm hệ đèn ray nam châm, hẹn gửi báo giá vào thứ 5..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs transition active:scale-95"
            >
              {customerToEdit ? 'Lưu Thay Đổi' : 'Tạo Khách Hàng Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
