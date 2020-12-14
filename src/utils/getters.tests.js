import { expect } from 'utils/testing';

import { getId, mapIds, getTagsByTopic, getArticlesByTag } from './getters';

describe('Getters Tests', () => {
  it('[getId] should return string', () => expect(getId({ _id: 1234 })).to.equal('1234'));
  it('[getId] should work with string', () => expect(getId({ _id: 'aba' })).to.equal('aba'));

  it('[mapIds] should return strings', () =>
    expect(mapIds([{ _id: 1 }, { _id: 2 }])).to.eql(['1', '2']));

  it('[getTagsByTopic] should accept empty tags & topics', () =>
    expect(getTagsByTopic({ tags: [], topics: [] })).to.eql({}));
  it('[getTagsByTopic] should filter unnecessary tags', () => {
    const tags = [
      { _id: 101, topic: 1 },
      { _id: 201, topic: 2 },
      { _id: 103, topic: 1 },
      { _id: 102, topic: 1 },
      { _id: 202, topic: 2 },
      { _id: 303, topic: 3 }, // unnecessary
    ];
    const topics = [
      { _id: 1, slug: 'topic1' },
      { _id: 2, slug: 'topic2' },
    ];
    return expect(getTagsByTopic({ tags, topics })).to.eql({
      topic1: [101, 103, 102],
      topic2: [201, 202],
    });
  });

  it('[getArticlesByTag] should accept empty articles', () =>
    expect(getArticlesByTag({ articles: [], tags: [] })).to.eql({}));
  it('[getArticlesByTag] should accept empty tags', () => {
    const articles = [
      {
        _id: 10,
        tags: [
          { _id: 1, slug: 'first' },
          { _id: 2, slug: 'second' },
        ],
      },
      {
        _id: 20,
        tags: [
          { _id: 1, slug: 'first' },
          { _id: 3, slug: 'third' },
        ],
      },
      { _id: 30, tags: [] },
    ];
    const tags = [
      { _id: 1, slug: 'first' },
      { _id: 2, slug: 'second' },
      { _id: 3, slug: 'third' },
    ];

    return expect(getArticlesByTag({ articles, tags })).to.eql({
      first: [10, 20],
      second: [10],
      third: [20],
    });
  });
  it('[getArticlesByTag] should accept not populated tags', () => {
    const articles = [
      { _id: 10, tags: [1, 2] },
      { _id: 20, tags: [1, 3] },
      { _id: 30, tags: [4] },
    ];
    const tags = [
      { _id: 1, slug: 'first' },
      { _id: 2, slug: 'second' },
      { _id: 3, slug: 'third' },
      { _id: 4, slug: 'fourth' },
    ];

    return expect(getArticlesByTag({ articles, tags })).to.eql({
      first: [10, 20],
      second: [10],
      third: [20],
      fourth: [30],
    });
  });
  it('[getArticlesByTag] should filter unnecessary tags', () => {
    const articles = [
      {
        _id: 10,
        tags: [
          { _id: 1, slug: 'first' },
          { _id: 2, slug: 'second' },
        ],
      },
      {
        _id: 20,
        tags: [
          { _id: 1, slug: 'first' },
          { _id: 3, slug: 'third' },
        ],
      },
      { _id: 30, tags: [{ _id: 2, slug: 'second' }] },
    ];
    const tags = [{ _id: 3, slug: 'first' }];

    return expect(getArticlesByTag({ articles, tags })).to.eql({
      first: [20],
    });
  });
});
