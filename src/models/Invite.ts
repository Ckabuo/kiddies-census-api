import mongoose, { Document, Schema } from 'mongoose';

export interface IInvite extends Document {
  email: string;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
  }
);

// Index for email lookup (token already has unique index from unique: true)
InviteSchema.index({ email: 1 });

export default mongoose.model<IInvite>('Invite', InviteSchema);
