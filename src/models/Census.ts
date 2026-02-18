import mongoose, { Document, Schema } from 'mongoose';

export interface IAgeBracket {
  range: string; // e.g., "1-5", "6-10", etc.
  count: number;
}

export interface ICensus extends Document {
  date: Date;
  service: string; // e.g., "First Service 7AM", "Second Service 10AM"
  serviceId?: string; // Optional service ID for frontend compatibility
  serviceName?: string; // Optional service name
  serviceTime?: string; // Optional service time
  ageBrackets: IAgeBracket[];
  teachers: string[];
  offering?: number;
  tithe?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AgeBracketSchema = new Schema<IAgeBracket>(
  {
    range: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const CensusSchema = new Schema<ICensus>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    service: {
      type: String,
      required: true,
    },
    serviceId: {
      type: String,
    },
    serviceName: {
      type: String,
    },
    serviceTime: {
      type: String,
    },
    offering: {
      type: Number,
      default: 0,
    },
    tithe: {
      type: Number,
      default: 0,
    },
    ageBrackets: {
      type: [AgeBracketSchema],
      required: true,
    },
    teachers: {
      type: [String],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for date queries
CensusSchema.index({ date: 1, service: 1 });

export default mongoose.model<ICensus>('Census', CensusSchema);
