import type { CallLog, Customer, FollowUpReminder, Notification, ProductItem, ProductSale, User } from '../types/crm';

export const requiresFollowUp = (status?: string) => ['Pre-order', 'Evaluation', 'Complaint'].includes(status || '');

export function callAutomation(call: CallLog, customer: Customer, users: User[]) {
  const reminders: FollowUpReminder[] = [];
  const notifications: Notification[] = [];
  const createdAt = new Date().toISOString();
  const rep = users.find(user => user.id === call.userId);
  const notify = (user: User, title: string) => notifications.push({ id: crypto.randomUUID(), recipientUserId: user.id, type: 'system', title, message: `${rep?.name || 'Rep'} — ${customer.customerName}: ${call.remark}`, read: false, createdAt });
  if (requiresFollowUp(call.callStatus) && call.nextFollowUpDate) {
    reminders.push({ id: `call-${call.id}`, customerId: customer.id, assignedRepId: call.userId, title: `${call.callStatus} follow-up`, purpose: call.purpose, dueDate: call.nextFollowUpDate, status: 'pending', reminderType: call.callStatus === 'Complaint' ? 'complaint' : 'manual', communicationId: call.id, createdAt });
  }
  if (call.callStatus === 'Complaint') {
    users.filter(user => user.role === 'Admin' || user.role === 'Marketing Manager').forEach(user => notify(user, 'Urgent Customer Complaint Logged'));
  }
  const mentions = new Set(Array.from(call.remark.matchAll(/@([a-zA-Z0-9_.-]+)/g), match => match[1].toLowerCase()));
  for (const user of users) {
    const aliases = [user.username, user.name.split(' ')[0], user.email.split('@')[0], ...(user.mentionAliases || [])].filter(Boolean).map(alias => alias!.toLowerCase());
    if (!aliases.some(alias => mentions.has(alias))) continue;
    notify(user, 'You were mentioned in a Call Note');
    reminders.push({ id: `mention-${call.id}-${user.id}`, customerId: customer.id, assignedRepId: user.id, title: 'Mentioned: customer support task', purpose: call.remark, dueDate: call.nextFollowUpDate || createdAt.split('T')[0], status: 'pending', reminderType: 'mention', communicationId: call.id, createdAt });
  }
  return { reminders, notifications };
}

export function afterSalesReminder(sale: ProductSale, product: ProductItem, repId: string): FollowUpReminder | null {
  const legacyMachines = ['Mug Press Machine Pro', '5-in-1 Combo Heat Press Machine', 'Flash Stamp Making Machine'];
  const machine = product.itemCategory.toLowerCase() === 'machines' || legacyMachines.includes(product.itemName);
  if (!machine || sale.status === 'cancelled') return null;
  const due = new Date(`${sale.saleDate.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(due.getTime())) return null;
  due.setUTCDate(due.getUTCDate() + 30);
  return { id: `sale-${sale.id}`, customerId: sale.customerId, assignedRepId: sale.salesRepId || repId, title: `30-Day Machine Check-in: ${product.itemName}`, purpose: 'Customer satisfaction check, technical review and consumable reorder.', dueDate: due.toISOString().split('T')[0], status: 'pending', reminderType: 'after_sales', saleId: sale.id, createdAt: new Date().toISOString() };
}
