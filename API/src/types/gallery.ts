export interface GalleryCategory {
    categoryKey: string;
    categoryName: string;
    categoryIcon: string;
}

export interface GalleryItem {
    id: string;
    mediaType: 'image' | 'video';
    categoryKey: string;
    title: string;
    description: string;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    videoUrl: string | null;
    createdAt: string;
    lastModifiedAt: string;
}

export interface CreateGalleryCategoryBody {
    categoryKey: string;
    categoryName: string;
    categoryIcon: string;
}

export interface CreateGalleryItemBody {
    id: string;
    mediaType: 'image' | 'video';
    categoryKey: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
}
