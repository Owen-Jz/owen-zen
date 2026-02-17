
import mongoose from 'mongoose';

const IntegrationSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true, // e.g. 'linkedin', 'twitter' (if we migrate later)
        enum: ['linkedin', 'twitter']
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String, // LinkedIn uses refresh tokens for long-lived access
    },
    expiresAt: {
        type: Date,
    },
    profileId: {
        type: String, // To differentiate accounts
    },
    profileName: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
