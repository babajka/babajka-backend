/* eslint-disable import/prefer-default-export */
/* eslint-disable no-unused-vars */

import { Article, ArticleType } from './models';

export const getAll = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 0;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  try {
    const query = Article.find({}).skip(page * pageSize).limit(pageSize);
    const articles = await query.exec();
    res.status(200).send({
      result: articles,
      next: {
        page: page + 1,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const article = await Article.findOne({ _id: id }).exec();
    if (article) {
      res.status(200).send({
        result: article,
      });
    } else {
      res.status(400).send({
        error: {
          message: `Article with id ${id} does not exist`,
        },
      });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const article = new Article(req.body);
    const error = article.validateSync();
    if (error) {
      res.status(400).send(error);
      return;
    }
    await article.save();
    res.status(201);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const update = async (req, res, next) => {
  const id = req.params.id;
  try {
    const updated = await Article.findByIdAndUpdate(id, req.body, { new: true }).exec();
  } catch (error) {
    res.status(500).send(error);
  }
};

export const remove = async (req, res, next) => {
  const id = req.params.id;
  try {
    await Article.findByIdAndRemove(id).exec();
  } catch (error) {
    res.status(500).send(error);
  }
};