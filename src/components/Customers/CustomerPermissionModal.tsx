import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, X, UserPlus, UserMinus, Shield, CheckCircle2 } from 'lucide-react';

interface CustomerPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export const CustomerPermissionModal: React.FC<CustomerPermissionModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
}) => {
  const { users, customers, currentUser, grantCustomerAccess, revokeCustomerAccess } = useApp();
  
  // Get the customer
  const customer = customers.find(c => c.id === customerId);
  if (!isOpen || !customer) return null;
  
  // Get Level 2 users in this organization
  const orgLevel2Users = users.filter(u => 
    u.role === 'sales_c2' && 
    (u.managerId === currentUser.id || u.createdBy === currentUser.id || u.organizationId === currentUser.organizationId)
  );
  
  const memberIds = customer.memberIds || [];
  
  const handleToggle = (userId: string, userName: string) => {
    if (memberIds.includes(userId)) {
      revokeCustomerAccess(customerId, userId);
    } else {
      grantCustomerAccess(customerId, userId, userName);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Phân quyền khách hàng</h2>
              <p className="text-sm text-slate-500 mt-0.5">{customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-slate-600 mb-4">
            Chọn nhân viên Sales (Level 2) được phép truy cập khách hàng này. 
            Nhân viên được chọn sẽ thấy thông tin khách hàng, báo giá và hợp đồng liên quan.
          </p>
          
          {orgLevel2Users.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có nhân viên Sales (Level 2) nào trong tổ chức.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orgLevel2Users.map(user => {
                const hasAccess = memberIds.includes(user.id);
                const isAssigned = customer.assignedToId === user.id;
                const isCreator = customer.createdBy === user.id;
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      hasAccess
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        hasAccess ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {isAssigned && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Phụ trách chính</span>
                        )}
                        {isCreator && !isAssigned && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Người tạo</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(user.id, user.name)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        hasAccess
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {hasAccess ? (
                        <><UserMinus className="w-3.5 h-3.5" /><span>Thu hồi</span></>
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" /><span>Cấp quyền</span></>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-green-500" />
              {memberIds.length} nhân viên có quyền truy cập
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
