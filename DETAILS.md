# Some Notes

## Heroku 설정 

1) heroku create
2) git push heroku 하면 설정된 곳으로 push
3) heroku git:remote -a sleepy-ravine-57378

## c9.io Node.js server 주소 

http://hearthstoneserver.jaebumlee.c9users.io/


## 서버 관련 알아야 될 사항들

1) Json web token 의 경우 (id) 를 인자로 가진다 (user_id 가 아니다!!)
2) 기본적으로 인증 방식은 일단 웹 페이지를 load 한 뒤에, AJAX 호출로 유저를 verify 한 후에
   그에 따른 정보를 로드하게 된다.


## 매치 서버 구현 방식 요약 

1) Queue 가 잡히면 현재 /match 에 listen 중인 socket 에 match-found socket 을 보낸다.
   그 socket 에는 현재 생성된 match 의 64 자리 (hex) 의 match-token 과 상대방 ID 정보가 들어가있다.

2) 받은 match-token 을 통해 앞 32 자리를 딴 주소로 이동한다. 즉 생성된 방의 경로 -> /match/match-token 앞 32 자리
   match-token 은 매우 unique 하기 때문에 비록 전체를 비교하지 않더라도 다른 방과 앞 32 자리가 겹칠 확률은 2^128 분의 1 이다.

3) 그 방으로 이동하면 마지막으로 match-token 을 이용해 검증을 실시한다. 이 때 검증 시, POST 로 전체 match-token 과 자신의 id 를 결합해서 보내게 된다.

4) 이를 이용해서 match 방으로 이동된 플레이어는 Match 를 성공적으로 진행할 수 있게 된다. 


# Implementation Details

## Matchmaking 방식

1. 사용자가 Match 페이지에 들어가게 되면 server 에 자신의 정보(token)를 담은 socket 을 보내는데, 이 token 이 valid 하면
   match_maker 에 자신의 id 와 해당 socket 의 정보를 저장해놓는다. 물론 페이지가 reload 되면 다시 정보를 보내게 되고, 
   match_maker 에는 해당 id 에 대응되는 socket 정보가 update 된다.

2. 사용자가 Match 페이지에서 매치 찾기를 누른다면, find-match 소켓이 전달되고, match_maker 에 해당 사용자가 선택한 덱
   정보가 전달된다. 

3. matching_queue 는 매 초 Matching pool 에 등록된 사용자들을 바탕으로 적절한 매치를 찾아준다. 만일 매치가 찾아졌다면 
   해당하는 두 사용자의 등록된 socket 에 match-found 소켓을 전달하며 이와 함께 생성된 고유의 match_token 역시 전달한다.
   이 match-found 소켓을 전달받은 클라이언트는 /match/(match_token 의 절반) 페이지로 이동하게 된다. 클라이언트는 
   match-token 을 브라우저 storage 에 저장해놓는다.

4. 따라서 클라이언트에서 /match/(match-token 의 절반) 으로 GET request 를 보내는데, 그 즉시 /match/(match-token 전체) 에
   socket listener 를 등록하게 된다. match 주소가 match-token 의 절반만을 사용하는 이유는 외부에서 주소를 보아도, 함부로
   match 에 접근할 수 없기 위함이다 (예를 들어 하스스톤 방송을 할 때). 물론 match-token 자체는 완전히 random 하게 생성되므로
   사용자가 그 다음 절반을 알아 내기는 불가능하다.

5. 클라이언트는 socket 통신이 establish 된 경우, player-info 소켓과 함께, 자신의 전체 match-token 과 id 를 전달한다.
   따라서 서버에서는 어떤 사용자가 연결되었는지 확인할 수 있는데, 만일 두 플레이어 모두가 연결되었다면, match_maker 의
   start_match 함수를 호출해서 match 를 시작한다. match_maker 의 start_match 함수는 hearth_game 의 start_match 함수를
   호출해서 실제 match 를 등록하게 된다. 


## 하수인 카드를 내는 방식 

현재 하수인 카드 내는 방식은 Hearthstone wiki 의 [Advanced rulebook](http://hearthstone.gamepedia.com/Advanced_rulebook) 을 참조하였습니다.

하수인 카드를 내는 단계는 일련의 Phase 로 구성되어 있으며, 각각의 phase 가 끝날 때 마다 Death Creation Step 을 밟게 됩니다. 
(사실 정확히 말하자면 summon resolution step 이 포함되어 있지만 여기 engine 에선 생략하도록 합니다)

1. 유저가 카드를 Play 합니다. Client 는 hearth-user-play-card 를 server 로 emit 하게 됩니다. 

2. server 의 listener 가 이를 accept 하게 되면 play_minion 함수를 호출하게 됩니다. 이 함수는 플레이어의 마나와, 하수인 자리가
    있는지 확인 한 후, 적합하다면 해당 카드의 on_play 함수를 호출하게 됩니다.
    
3. on_play 함수는 그 하수인 카드를 실행하는데 필요한 선제적 작업들을 하는데, 예를 들어 선택 이나, 소환하면서 다른 하수인을 타게팅
    하는 경우 (ex 무쇠부리 올빼미, 나 이런 사냥꾼이야 등)에 어떠한 것을 선택하는지 기억하는 역할을 합니다. (아직 반영되지는 않음)
    여기서 통과하지 못한다면 emit_play_card_fail 를 통해 client 로 잘못되었음을 전달합니다. 통과한다면 play_success 함수를 호출합니다.
    
4. play_success 함수 까지 도달하였다면 이제 카드는 실질적으로 드로우 된 상태입니다. 내 hand 에서 해당 하수인 카드를 제거하고, 
    마나 코스트를 줄이고, 필드에 이를 소환합니다. 또한 emit_play_card_success 를 호출해서 client 에 카드가 필드로 드로우 되었음을
    알립니다. 
    
    여기서 play_card 이벤트를 발생시키고, battlecry_phase 함수를 다음 phase 로 등록합니다.  play_card 이벤트에 발동하는 카드들은
    
    > 밥통고블린, 지옥 절단기, 일리단 스톰레이지
    
5. battlecry_phase 함수는 해당하는 카드의 text 를 수행한다고 보면 됩니다. (전투의 함성만 수행하는 것이 아닙니다) 다만 여기서 중요한 것은
    g_handler 의 add_phase_block 를 true 로 만들어서 phase 가 추가되는 것을 방지하는데, 이는 카드의 text 를 수행함에 있어서 다른 phase
    가 발생하는 것을 사전 차단하기 위함입니다. (ex. battlecry 로 다른 하수인을 생성하는 경우 summon phase 가 생길 수 있다)
    
    물론 카드 text 단계에서 다른 battlecry 가 발생하는 경우는 없기 때문에 (유저가 직접적으로 play 하지 않으므로) 큰 문제 없습니다.
    카드 text 내용이 모두 수행되었다면 카드 내부에서 end_bc 를 호출합니다. 
    
6. end_bc 함수는 lock 된 add_phase_block 을 풀고, after_play_phase 를 다음 phase 로 등록합니다. 

7. after_play_phase 는 after_play 이벤트를 발생시키고, summon_phase 를 콜백으로 등록합니다. 이 때 콜백으로 등록하는 이유는 after-play phase 와
    summon-phase 사이에서 death creation step 이 생략되기 때문입니다.
    
    after_play 이벤트에 발동하는 카드들은
    
    > 거울상, 참회, 저격
    
8. summon_phase 는 summon event 를 발생시킵니다. 또한 summon 단계에서 하수인 카드의 행동 여부를 설정합니다 (atk_cnt 정보 설정)
    이 단계에서 설정하는 이유는 카드 text 가 실행되는 단계에서 charge 혹은 windfury 여부가 결정되기 때문입니다.

    summon event 에 발동하는 카드들은
    
   > 단검 곡예사, 함포 등등

## 하수인이 다른 하수인/영웅을 공격시에 - combat

1. 일단 상대방(target) 이 적합한 목표물인지 확인한 후 (다른 도발카드들은 없는지, 이 카드가 현재 턴에 공격 가능한지 등등)
    이 카드에 target 을 지정해준 뒤에 propose_attack 이벤트를 발생시킨다. propose_attack 이벤트가 끝나면 attack 함수를
    호출한다.

    > propose_attack 이벤트에 핸들러를 가지는 카드들 : 빙결의 덫, 폭발의 덫, 눈속임, 뱀 덫, 고귀한 희생, 증발시키기, 모고르

2. attack 함수에서는 공격을 한 카드의 상태를 확인한 이후에 괜찮다면 attack 이벤트를 발생시킨다. attack 이벤트가 끝나면
    pre_combat 함수를 호출한다.

    > attack 이벤트에 핸들러를 가지는 카드들 : 용사의 진은검, 얼음 보호막, 신의 권능 : 영광, 지혜의 축복

3. pre_combat 함수에 도달하였다면 더 이상 공격 target 이 바뀔일은 없게 된다. 따라서 공격 카드의 dmg_given 에 자신의
    공격 dmg 를, target 의 dmg_given 에 자신의 dmg 을 써준다. (영웅을 제외하면 서로 데미지를 주고받기 때문) 그 후에
    pre_dmg 이벤트를 발생시킨다. pre_dmg 이벤트가 끝나면 actual_combat 함수를 호출한다.

    > pre_dmg 이벤트에 핸들러를 가지는 카드들 : 얼음 방패, 볼프 램쉴드, 지휘관의 외침

4. actual_combat 함수에서 실제 공격을 수행한다. 이를 바탕으로 주고 받은 데미지가 0 보다 크면 take_dmg, deal_dmg 이벤트가 발생하며
    파괴된 하수인이 있다면 그 하수인에 대한 destroyed 이벤트가 발생하게 된다. 참고로, 이벤트가 발생하는 순서는 take_dmg 는 언제나
    target 이 먼저 발동하며, deal_dmg 는 공격자의 것이 먼저 발생된다.
    
    참고로 여기서 사용자에게 combat 결과를 알려주는 minion_battle 이벤트 정보가 클라이언트로 전송된다. 

## 드루이드 선택 카드 과정 설명

 - choose_one 함수 내에서 select_one 함수가 호출될 수 있기 때문에 이 함수에 Pass 해야 할 정보에 대한 인자들도 가지고 있다.
  (forced_target, random_target 이 그 예 이다. )
  
 - choose_one 함수의 option 에는 사용자에게 보이고자 하는 ~~카드들의 이름이 들어가 있다.~~ 보통 보여지는 카드의 이름이 같은 경우가
  있어서 card unique ID 를 전달한다 (예) Wrath.  기존에는 Card 의 Name 을 기준으로 하였지만 현재는 카드의 unique ID 를 기준으로 해야 한다. 
  
1. Spell 혹은 Minion 을 play 하면 choose_one 함수가 실행된다. Engine 에 변수들을 추가하는 것을 막기 위해서, select_one 함수가
   사용하고 있었던 인자들을 재활용 하였는데;
  
```javascript
  this.selection_fail_timer = null;  // 사용자가 시간 내에 choose 를 하지 않았을 때
  this.available_list = []; // option 리스트를 포함한다. 

  this.on_select_success = null; // 사용자가 choose 하였을 때
  this.on_select_fail = null; // 사용자가 choose 하지 않았을 때
  
  그 외로 
  
  this.choose_waiting = false; // 현재 choose 를 기다리고 있는지
  this.forced_target = null; // select_one 함수에 전달할 인자 (혹시 있다면)
  this.random_target = null;
  this.must_choose = false; // 반드시 user 가 choose 해야만 하는가 (Discover 에 해당)
  ```
 
  가 있다. 
  
2. choose_one 함수가 사용자의 결과를 잘 받았다면 해당되는 on_select_success 함수를 호출하며 종료된다.
   참고로 판드랄 스테그헬름의 경우 choose 되는 결과가 2 가 된다 (보통 Choose One 은 둘 중 한 개를 고르기 때문에
   0 아니면 1 이 전달되어야 하지만 이 경우 forced_choose 가 적용된다) 

3. 물론 on_select_success 함수를 호출하면서 또 다른 select_one 을 수행할 수 도 있다 (Keeper of the Grove)
   이 경우에는 다시 그 함수 안에서 select_one 함수를 호출하면 된다. 
  
