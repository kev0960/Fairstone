# 흙스스톤 - Fairstone #

흙스스톤은 본인과 같은 하스스톤에 과금할 생각이 없는 사람들을 위한 하스스톤 서버로, 모든 사용자들이 자유롭게 모든 카드들을
이용할 수 있도록 하는 것을 목표로 합니다. 또한, 등급전 보다 좀 더 정확한 내 등급을 알려주기 위해 MMR 을 기반으로 한 매칭을
수행하며, 특히 각 직업 별 MMR 을 따로 기록 해서, Rank Match 에서 승률이 낮은 직업을 사용하더라도, 그 직업을 플레이 
하는 사람 들 중에서 내가 얼마나 돋보이는지를 평가할 수 있게 하였습니다. 

흙스스톤은 클라이언트를 따로 설치할 필요 없이 단순히 서버에 접속하는 것만으로도 전체 게임을 이용할 수 있습니다. 모든 리소스는
서버로 부터 게임 도중에 자동으로 다운로드 할 수 있습니다. (물론, 이 서버가 아닌 다른 외부 API 를 이용하기 때문에 서버에 부하를
줄일 수 있습니다) 또한, 외부로 매치 주소가 노출되더라도 다른 사용자들은 매치에 접근할 수 없고 단순히 관전만 할 수 있으므로
안전합니다.

기존 하스스톤 클라이언트와는 달리 더욱 편리한 덱 구성 UI 를 제공하며, 저장할 수 있는 덱의 개수도 50 개로 거의 제한이 없다고
볼 수 있습니다. 또한 기존에 하스스톤 클라이언트에 Deck Tracker 를 설치해야만 볼 수 있었던 여러가지 정보들을 웹 화면에서 기본
으로 제공하고, 또 승률 또한 기본으로 기록 하기 때문에 좀 더 편리한 매치를 즐길 수 있습니다.

This Hearthstone server - Fairstone aims people like me who are not willing to buy the cards for the real Hearthstone. We want
every player to play in a same condition by providing them entire collections of Hearthstone cards. Also, we want to measure
out performance not soely based on win/lose results but many factors including Job strength, deck strength etc. 

Fairstone does not require the players to install additional client. They can simply enjoy the match by connecting the server. 
All the necessary resources will be automatically downloaded during a match (Note that because we are using external image
database, there will be no load to the main matching server). 

Unlike the previous Hearthstone client, Fairstone provides a convenient deck building UI and much more spaces to store the
decks. Also, features that were only possible through installing Deck tracker will also be natively provided in a matching
page. 

## Features ##

- Node.js based matching server and game engine
- Client Free Hearthstone game
- Lite and Fast, works well on low performance computers
- (TODO) Supports Linux Console (TUI) 

## Basic Info ##

This Hearthstone Server - Fairstone is based on Node.js and Express engine. It uses Socket.io to communicate between
the server and a client. Entire source is purely written in Javascript (Now considering porting to Typescript). 

We are using RethinkDB as a database which will record all of the matches and user information. 

All of source files are located in /src folder.

## Quick Start ##

Download the Fairstone source files 

`git clone https://kev0960@bitbucket.org/kev0960/hearthstone-server.git`

You first need to start RethinkDB server so that Fairstone server can connect to. 

`rethinkdb --no-http-admin`

Start the server (You may need to install npm dependencies too)

`npm start`

As the server starts, card_api will automatically download the latest Hearthstone card infos through the Hearthstone API. 

## Current Progress ##

As of April 24 '16, Most of the neutral original cards are created (total 178)
As of June 6 '16, All of the Original, The Grant Tournament, League of the Explorers, Whispers of the Old Gods cards are created (total ~700)

## Admin Commands ##

To debug, you can type several admin commands to the Fairstone server. The supporting commands are

`add <p1 or p2> <Name of the Card>`

`mana <p1 or p2> <Mana you want to give>`

These commands will be applied to the latest matching game.

## Contributors ##

Original author of Fairstone is Jaebum Lee

Current maintainer is Jaebum Lee 

