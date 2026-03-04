// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/messages.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const Message = require('../../../models/Message');
const User = require('../../../models/User');
const { requireAuthAPI } = require('../../../middleware/auth');

// ===== جلب ID خدمة العملاء (الأدمن الأول) =====
// تم تعديل المنطق ليعطي الأولوية لـ super_admin أو أي أدمن متاح
async function getSupportAgentId() {
    const admin = await User.findOne({
        role: { $in: ['admin', 'super_admin', 'manager'] }
    }).sort({ role: 1 }).select('_id name'); // الفرز يجعل super_admin يظهر أولاً
    return admin;
}

// ===== التواصل مع خدمة العملاء (للعملاء) =====
router.post('/support', requireAuthAPI, async (req, res) => {
    try {
        const senderId = req.user.userId || req.user._id || req.user.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: 'محتوى الرسالة مطلوب' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ success: false, error: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)' });
        }

        // جلب الأدمن المتاح حالياً لاستلام الرسالة
        const support = await getSupportAgentId();
        if (!support) {
            return res.status(503).json({ success: false, error: 'خدمة العملاء غير متاحة حالياً' });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: support._id,
            content: content.trim(),
            read: false
        });

        res.status(201).json({
            success: true,
            message: 'تم إرسال رسالتك لخدمة العملاء',
            data: {
                id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                supportName: support.name
            }
        });
    } catch (error) {
        console.error('خطأ في إرسال رسالة الدعم:', error);
        res.status(500).json({ success: false, error: 'فشل في إرسال الرسالة' });
    }
});

// ===== جلب محادثة العميل مع خدمة العملاء (للعملاء) =====
router.get('/support', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        // جلب الأدمن (يمكن للعميل رؤية رسائل أي أدمن رد عليه)
        const support = await getSupportAgentId();

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: { $exists: true } }, // أي رسائل من العميل لأي شخص (عادة أدمن)
                { receiver: userId } // أي رسائل واردة للعميل
            ]
        }).sort({ createdAt: 1 });

        // تحديد الرسائل القادمة من الأدمن كمقروءة
        await Message.updateMany(
            { receiver: userId, read: false },
            { read: true }
        );

        res.json({
            success: true,
            supportId: support?._id,
            supportName: support?.name || 'خدمة العملاء',
            data: messages.map(m => ({
                id: m._id,
                content: m.content,
                isFromMe: m.sender.toString() === userId.toString(),
                read: m.read,
                createdAt: m.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب محادثة الدعم:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب الرسائل' });
    }
});

// ===== الحصول على جميع المحادثات (للأدمن) =====
// تم تعديلها لتسمح للأدمن برؤية كافة المحادثات في حال كان لديه الصلاحية
router.get('/conversations', requireAuthAPI, async (req, res) => {
    try {
        const currentUserId = req.user.userId || req.user._id || req.user.id;
        const isAdmin = ['admin', 'super_admin', 'manager'].includes(req.user.role);

        // إذا كان أدمن، نأتي بكل المحادثات التي أطرافها (مستخدم عادي + أي أدمن)
        // أو ببساطة كل المحادثات التي يكون الأدمن طرفاً فيها (أو كلها إذا كانت Super Admin)
        let matchQuery = { $or: [{ sender: currentUserId }, { receiver: currentUserId }] };

        if (isAdmin) {
            // الأدمن يمكنه رؤية جميع المحادثات الموجهة لطاقم الإدارة
            const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin', 'manager'] } }).select('_id');
            const adminIds = adminUsers.map(u => u._id);
            matchQuery = {
                $or: [
                    { sender: { $in: adminIds } },
                    { receiver: { $in: adminIds } }
                ]
            };
        }

        const messages = await Message.aggregate([
            { $match: matchQuery },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $in: ['$sender', [currentUserId]] }, // هذا يحتاج تعديل للمنطق العام
                            '$receiver',
                            '$sender'
                        ]
                    },
                    // محاولة تحسين الـ group لتجميع المحادثة بين (العميل والأدمن)
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiver', currentUserId] }, { $eq: ['$read', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // جلب معلومات الأطراف الأخرى في المحادثات
        const otherUserIds = messages.map(m => m.lastMessage.sender.toString() === currentUserId.toString() ? m.lastMessage.receiver : m.lastMessage.sender);
        const users = await User.find({ _id: { $in: otherUserIds } }).select('name email role');
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        res.json({
            success: true,
            data: messages.map(m => {
                const otherId = m.lastMessage.sender.toString() === currentUserId.toString() ? m.lastMessage.receiver : m.lastMessage.sender;
                const otherUser = userMap[otherId.toString()];

                return {
                    id: otherId,
                    user: otherUser || { name: 'مستخدم محذوف' },
                    lastMessage: {
                        content: m.lastMessage.content,
                        createdAt: m.lastMessage.createdAt,
                        isFromMe: m.lastMessage.sender.toString() === currentUserId.toString()
                    },
                    unreadCount: m.unreadCount
                };
            })
        });
    } catch (error) {
        console.error('خطأ في جلب المحادثات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المحادثات' });
    }
});

// الحصول على رسائل محادثة معينة
router.get('/conversation/:userId', requireAuthAPI, async (req, res) => {
    try {
        const currentUserId = req.user.userId || req.user._id || req.user.id;
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // تحديد الرسائل كمقروءة
        await Message.updateMany(
            { sender: userId, receiver: currentUserId, read: false },
            { read: true }
        );

        res.json({
            success: true,
            data: messages.reverse().map(m => ({
                id: m._id,
                content: m.content,
                isFromMe: m.sender.toString() === currentUserId.toString(),
                read: m.read,
                createdAt: m.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب الرسائل:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب الرسائل' });
    }
});

// إرسال رسالة جديدة
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const senderId = req.user.userId || req.user._id || req.user.id;
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ success: false, error: 'المستلم والمحتوى مطلوبان' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ success: false, error: 'الرسالة طويلة جداً' });
        }

        // التحقق من وجود المستلم
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, error: 'المستلم غير موجود' });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content: content.trim(),
            read: false
        });

        res.status(201).json({
            success: true,
            message: 'تم إرسال الرسالة',
            data: {
                id: message._id,
                content: message.content,
                createdAt: message.createdAt
            }
        });
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في الإرسال' });
    }
});

// تحديد رسالة كمقروءة
router.patch('/:id/read', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { id } = req.params;

        const message = await Message.findOneAndUpdate(
            { _id: id, receiver: userId },
            { read: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
        }

        res.json({
            success: true,
            message: 'تم تحديد الرسالة كمقروءة'
        });
    } catch (error) {
        console.error('خطأ في تحديث الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في التحديث' });
    }
});

// حذف رسالة
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;
        const { id } = req.params;

        const message = await Message.findOneAndDelete({
            _id: id,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({ success: false, error: 'الرسالة غير موجودة أو لا يمكنك حذفها' });
        }

        res.json({
            success: true,
            message: 'تم حذف الرسالة'
        });
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        res.status(500).json({ success: false, error: 'فشل في الحذف' });
    }
});

// عدد الرسائل غير المقروءة
router.get('/unread-count', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        const count = await Message.countDocuments({
            receiver: userId,
            read: false
        });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('خطأ في حساب الرسائل:', error);
        res.status(500).json({ success: false, error: 'فشل في الحساب' });
    }
});

module.exports = router;
