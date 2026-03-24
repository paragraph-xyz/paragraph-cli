import React from "react";
import { useNavigation } from "./hooks/useNavigation.js";
import { useAuth } from "./hooks/useAuth.js";
import { MainMenu } from "./screens/MainMenu.js";
import { AccountMenu } from "./screens/AccountMenu.js";
import { MyPostsMenu } from "./screens/MyPostsMenu.js";
import { MySubscribersMenu } from "./screens/MySubscribersMenu.js";
import { PostsMenu } from "./screens/PostsMenu.js";
import { GetPost } from "./screens/GetPost.js";
import { Feed } from "./screens/Feed.js";
import { PostsByTag } from "./screens/PostsByTag.js";
import { PublicationsMenu } from "./screens/PublicationsMenu.js";
import { SearchMenu } from "./screens/SearchMenu.js";
import { CoinsMenu } from "./screens/CoinsMenu.js";
import { Login } from "./screens/Login.js";
import { Whoami } from "./screens/Whoami.js";
import { BrowsePosts } from "./screens/BrowsePosts.js";
import { PostList } from "./screens/PostList.js";
import { PostDetail } from "./screens/PostDetail.js";
import { PostCreate } from "./screens/PostCreate.js";
import { PostUpdate } from "./screens/PostUpdate.js";
import { PostDelete } from "./screens/PostDelete.js";
import { PublicationDetail } from "./screens/PublicationDetail.js";
import { MyPublication } from "./screens/MyPublication.js";
import { SearchPosts } from "./screens/SearchPosts.js";
import { SearchBlogs } from "./screens/SearchBlogs.js";
import { SubscriberList } from "./screens/SubscriberList.js";
import { SubscriberAdd } from "./screens/SubscriberAdd.js";
import { SubscriberImport } from "./screens/SubscriberImport.js";
import { CoinDetail } from "./screens/CoinDetail.js";
import { CoinSearch } from "./screens/CoinSearch.js";
import { CoinHolders } from "./screens/CoinHolders.js";
import { PopularCoins } from "./screens/PopularCoins.js";
import { SubscriberCount } from "./screens/SubscriberCount.js";
import { UserDetail } from "./screens/UserDetail.js";

const AUTH_REQUIRED = new Set([
  "account", "my-posts", "my-subscribers",
  "post-list", "post-create", "post-update", "post-delete",
  "subscriber-list", "subscriber-add", "subscriber-import",
  "my-publication", "whoami",
]);

export function Router() {
  const { screen } = useNavigation();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn && AUTH_REQUIRED.has(screen.name)) {
    return <Login />;
  }

  switch (screen.name) {
    case "main-menu":
      return <MainMenu />;
    case "account":
      return <AccountMenu />;
    case "my-posts":
      return <MyPostsMenu />;
    case "my-subscribers":
      return <MySubscribersMenu />;
    case "posts-menu":
      return <PostsMenu />;
    case "get-post":
      return <GetPost />;
    case "feed":
      return <Feed />;
    case "posts-by-tag":
      return <PostsByTag />;
    case "publications-menu":
      return <PublicationsMenu />;
    case "search-menu":
      return <SearchMenu />;
    case "coins-menu":
      return <CoinsMenu />;
    case "login":
      return <Login />;
    case "whoami":
      return <Whoami />;
    case "browse-posts":
      return <BrowsePosts />;
    case "post-list":
      return <PostList />;
    case "post-detail":
      return <PostDetail />;
    case "post-create":
      return <PostCreate />;
    case "post-update":
      return <PostUpdate />;
    case "post-delete":
      return <PostDelete />;
    case "publication-detail":
      return <PublicationDetail />;
    case "my-publication":
      return <MyPublication />;
    case "search-posts":
      return <SearchPosts />;
    case "search-blogs":
      return <SearchBlogs />;
    case "subscriber-list":
      return <SubscriberList />;
    case "subscriber-add":
      return <SubscriberAdd />;
    case "subscriber-import":
      return <SubscriberImport />;
    case "coin-detail":
      return <CoinDetail />;
    case "coin-search":
      return <CoinSearch />;
    case "coin-holders":
      return <CoinHolders />;
    case "popular-coins":
      return <PopularCoins />;
    case "subscriber-count":
      return <SubscriberCount />;
    case "user-detail":
      return <UserDetail />;
    default:
      return <MainMenu />;
  }
}
