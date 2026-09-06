export interface Review {
  id: number;
  userId: number;
  userName: string | null;
  tourId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourReviews {
  reviews: Review[];
  averageRating: number | null;
  totalCount: number;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}
