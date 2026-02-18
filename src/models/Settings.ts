import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceConfig {
  id: string;
  name: string;
  time: string;
}

export interface ISettings extends Document {
  key: string;
  value: any;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
