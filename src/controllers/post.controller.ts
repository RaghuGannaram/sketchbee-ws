import type { Request, Response } from "express";
import postBusinessService from "@src/services/post.business";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import { HttpError, HttpErrors } from "@src/utils/application-errors";
import type { IVerifiedRequest, IPostCreate, IPostUpdate, IController } from "@src/types";

const getAllPosts: IController = catchAsyncError(async (_req: Request, res: Response) => {
    const posts = await postBusinessService.getAllPosts();

    res.status(200).json({ posts: posts });
});

const getUserPosts: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "userId not provided.");

    const posts = await postBusinessService.getUserPosts(userId);

    res.status(200).json({ posts: posts });
});

const getPost: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { postId } = req.params;

    if (!postId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId not provided.");

    const post = await postBusinessService.getPost(postId);

    res.status(200).json({ post: post });
});

const getTimelinePosts: IController = catchAsyncError(async (req: Request, res: Response) => {
    const authUser = (req as IVerifiedRequest).user;

    const posts = await postBusinessService.getTimelinePosts(authUser);

    res.status(200).json({ posts: posts });
});

const addPost: IController = catchAsyncError(async (req: Request, res: Response) => {
    if (!req.file && !req.body.description)
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "no file and description provided.");

    let data: IPostCreate = {
        description: req.body.description || "",
        image: "",
    };

    if (req.file) data.image = req.file;

    const authUser = (req as IVerifiedRequest).user;
    const post = await postBusinessService.addPost(authUser, data);

    res.status(200).json({ post: post });
});

const updatePost: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { postId } = req.body;
    if (!postId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId not provided.");

    if (!req.file && !req.body.description)
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "no file and description provided.");

    let data: IPostUpdate = {
        description: req.body.description,
    };

    if ("image" in req.body) data.image = req.body.image;
    if (req.file) data.file = req.file;

    const authUser = (req as IVerifiedRequest).user;
    const updatedPost = await postBusinessService.updatePost(authUser, postId, data);

    res.status(200).json({ post: updatedPost });
});

const likePost: IController = catchAsyncError(async (req: Request, res) => {
    const { postId } = req.body;
    if (!postId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId not provided.");

    const authUser = (req as IVerifiedRequest).user;
    const response = await postBusinessService.likePost(authUser, postId);

    res.status(200).json({ message: response });
});

const deletePost: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { postId } = req.params;
    if (!postId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId not provided.");

    const authUser = (req as IVerifiedRequest).user;
    const response = await postBusinessService.deletePost(authUser, postId);

    res.status(200).json({ message: response });
});

export default {
    getAllPosts,
    getUserPosts,
    getTimelinePosts,
    getPost,
    addPost,
    updatePost,
    likePost,
    deletePost,
};
