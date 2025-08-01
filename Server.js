require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const app = express();

app.use(cors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, 
}));

app.use(helmet({crossOriginResourcePolicy: false}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const {createDefaultAdmin} = require('./Authentication/adminController'); // ✅ Import

const mongoUri = process.env.MONGO_URI_LOCAL;
mongoose.connect(mongoUri)
    .then(() => console.log("✅ Database connected"))
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });




const authRoutes = require('./Authentication/loginRoutes');
const adminAuthRoutes = require('./Authentication/adminRoutes');
const clientAuthRoutes = require('./Authentication/clientRoutes');
const freelanceAuthRoutes = require('./Authentication/freelanceRoutes');
const freelancerProfileRoutes = require('./Profile-Details/freelancerProfileRoutes');
const clientProfileRoutes = require('./Profile-Details/clientProfileRoutes');
const otpVerificationRoutes = require('./Otp-Verification/otpVerificationRoutes');
const changePasswordRoutes = require('./Password/changePasswordRoutes');
const forgotPasswordRoutes = require('./Password/forgotPasswordRoutes');

const notificationRoutes = require('./Notifications/notificationRoutes');

const jobPostRoutes = require('./JobPosts/jobPostsRoutes');
const companyRoutes = require("./Company/companyRoutes");

const meetingRoutes = require("./Meetings/meetingRoutes");
const offerLetterRoutes = require("./Offer-letter/offerLetterRoutes");


app.use('/api', adminAuthRoutes);
app.use('/api', clientAuthRoutes);
app.use('/api', freelanceAuthRoutes);
app.use('/api', otpVerificationRoutes);
app.use('/api', authRoutes);
app.use('/api', clientProfileRoutes);
app.use('/api', freelancerProfileRoutes);
app.use('/api', changePasswordRoutes);
app.use('/api', forgotPasswordRoutes);

app.use('/api',notificationRoutes);

app.use('/api',jobPostRoutes);
app.use('/api',companyRoutes);

app.use('/api',meetingRoutes);
app.use('/api',offerLetterRoutes);

createDefaultAdmin();

app.get('/', (req, res) => {
    res.json({ message: "Hello from the server" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server started on port ${PORT}`);
});
