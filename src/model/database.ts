export interface Dish {
    id: string;
    name: string;
    description: string;
    price: number;
    image: Image;
    extras: string[];
}

export interface Image {
    name: string;
    content?: string;
    contentType: string;
    mimeType: string;
}

export enum ContentTypes {url = 0, binary}

export interface Ingredient {
    id: string;
    name: string;
    price: number;
    description: string;
}

export interface DishCategory {
    id: string;
    idDish: string;
    idCategory: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    group?: number;
    showOrder: number;
}
