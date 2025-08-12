require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Ensure uploads folder exists =====
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('📂 Created uploads folder');
}

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Base64 images large ah irukum so limit 10MB
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads folder for normal images
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== User Schema =====
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// ===== Message Schema =====
const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    image: String, // can be path or base64
    date: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ===== Multer Storage Config for file upload =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ===== Routes =====

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Signup =====
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.json({ success: true, message: 'Signup successful' });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== Login =====
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid username or password' });
        }

        res.json({ success: true, message: 'Login successful' });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== Upload Notice (Normal file upload) =====
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        console.log("=== Upload Debug Start ===");
        console.log("Body:", req.body);
        console.log("File:", req.file);
        console.log("==========================");

        const { text, username } = req.body;
        if (!text && !req.file) {
            return res.status(400).json({ success: false, message: 'Text or image is required' });
        }

        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const newMessage = new Message({ username, text, image: imagePath });
        await newMessage.save();

        res.json({ success: true, message: 'Upload successful', data: newMessage });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== Upload Notice (Base64) =====
app.post('/upload_base64', async (req, res) => {
    try {
        const { text, username, imageBase64 } = req.body;

        console.log("=== Upload Base64 Debug ===");
        console.log("Text:", text);
        console.log("Username:", username);
        console.log("Image Base64 present?", !!imageBase64);
        console.log("===========================");

        if (!text && !imageBase64) {
            return res.status(400).json({ success: false, message: 'Text or image is required' });
        }

        const newMessage = new Message({
            username: username || "guest",
            text: text || null,
            image: imageBase64 || null
        });

        await newMessage.save();
        res.json({ success: true, message: 'Upload successful', data: newMessage });

    } catch (err) {
        console.error('Upload Base64 error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== Get Latest Notice =====
app.get('/api/notice/latest', async (req, res) => {
    try {
        const latest = await Message.findOne().sort({ date: -1 });
        if (!latest) {
            return res.json({ text: 'No notice text available.', image: null });
        }
        res.json({ text: latest.text, image: latest.image || null });
    } catch (err) {
        console.error('Fetch latest notice error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== Get All Messages =====
app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.json(messages);
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ===== Start Server =====
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
