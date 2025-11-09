import type { Request, Response } from "express";
import commentBusinessService from "@src/services/comment.business";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import { HttpError, HttpErrors } from "@src/utils/application-errors";
import type { IVerifiedRequest, IController } from "@src/types";

const getAllComments: IController = catchAsyncError(async (_req: Request, res: Response) => {
    const comments = await commentBusinessService.getAllComments();

    res.status(200).json({ comments: comments });
});

const getUserComments: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "userId not provided.");

    const comments = await commentBusinessService.getUserComments(userId);

    res.status(200).json({ comments: comments });
});

const getPostComments: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { postId } = req.params;

    if (!postId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId not provided.");

    const comments = await commentBusinessService.getPostComments(postId);

    res.status(200).json({ comments: comments });
});

const addComment: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { postId, description } = req.body;

    if (!postId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId not provided.");
    if (!description) throw new HttpError(400, HttpErrors.BAD_REQUEST, "description not provided.");

    const authUser = (req as IVerifiedRequest).user;

    const data = {
        description: description,
    };

    const comment = await commentBusinessService.addComment(authUser, postId, data);

    res.status(200).json({ comment: comment });
});

const updateComment: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { commentId, description } = req.body;

    if (!commentId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "commentId not provided.");
    if (!description) throw new HttpError(400, HttpErrors.BAD_REQUEST, "description not provided.");

    const authUser = (req as IVerifiedRequest).user;

    const data = {
        description: description,
    };

    const comment = await commentBusinessService.updateComment(authUser, commentId, data);

    res.status(200).json({ comment: comment });
});

const likeComment: IController = catchAsyncError(async (req: Request, res) => {
    const { commentId } = req.body;

    if (!commentId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "postId/commentId not provided.");

    const authUser = (req as IVerifiedRequest).user;
    const response = await commentBusinessService.likeComment(authUser, commentId);

    res.status(200).json({ message: response });
});

const deleteComment: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { commentId } = req.params;

    if (!commentId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "commentId not provided.");

    const authUser = (req as IVerifiedRequest).user;
    const response = await commentBusinessService.deleteComment(authUser, commentId);

    res.status(200).json({ message: response });
});

export default {
    getAllComments,
    getUserComments,
    getPostComments,
    addComment,
    updateComment,
    likeComment,
    deleteComment,
};
