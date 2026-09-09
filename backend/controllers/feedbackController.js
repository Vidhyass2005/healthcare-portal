const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res, next) => {
  try {
    const { rating, category, comments, doctorOrDepartment, consultationQuestions } = req.body;
    if (!rating || !comments) {
      return res.status(400).json({ success: false, message: 'Rating and comments are required' });
    }
    const feedback = await Feedback.create({
      patient: req.user.id,
      patientName: req.user.name,
      patientEmail: req.user.email || '',
      patientPhone: req.user.phone || '',
      rating: Number(rating),
      category: category || 'OPD Consultation',
      doctorOrDepartment: doctorOrDepartment || 'General',
      consultationQuestions: consultationQuestions || {},
      comments
    });
    res.status(201).json({ success: true, message: 'Feedback submitted successfully. Thank you!', feedback });
  } catch (error) {
    next(error);
  }
};

exports.getMyFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: feedbacks.length, feedbacks });
  } catch (error) {
    next(error);
  }
};

exports.getAllFeedbacksAdmin = async (req, res, next) => {
  try {
    const { category, rating, status } = req.query;
    let query = {};
    if (category && category !== 'All') query.category = category;
    if (rating && rating !== 'All') query.rating = Number(rating);
    if (status && status !== 'All') query.status = status;
    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });
    const totalCount = await Feedback.countDocuments();
    const groupStage = {};
    groupStage['_id'] = null;
    groupStage['avg'] = {};
    groupStage['avg']['$avg'] = '$rating';
    const avgRatingAgg = await Feedback.aggregate([{ '$group': groupStage }]);
    const avgRating = avgRatingAgg.length > 0 ? Number(avgRatingAgg[0].avg.toFixed(1)) : 5.0;
    res.status(200).json({ success: true, count: feedbacks.length, totalCount, avgRating, feedbacks });
  } catch (error) {
    next(error);
  }
};

exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    if (status) feedback.status = status;
    if (adminReply !== undefined) feedback.adminReply = adminReply;
    await feedback.save();
    res.status(200).json({ success: true, message: 'Feedback updated successfully', feedback });
  } catch (error) {
    next(error);
  }
};