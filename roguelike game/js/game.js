// 创建画布
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1920;  // 宽度为视窗宽度的80%
canvas.height = 1080; // 高度为视窗高度的80%
document.body.appendChild(canvas);
var isPaused = false;  // 游戏暂停标志

function pauseGame() {
    isPaused = true;
}
function resumeGame() {
    isPaused = false;
}
function resetKeyState() {
    keysDown = {};  // 重置按键状态，防止英雄位置跳变
}
// 背景图像
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background1.png";

// 英雄图像
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "images/hero.png";

// 怪物图像
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "images/monster.png";

//史莱姆图像
var slimeReady=false;
var slimeImage= new Image();
var slimeFrames = [];
var slimeCount = 4; // 总帧数
for (var i = 0; i < slimeCount; i++) {
	var slimeImage = new Image();
	slimeImage.onload = (function(i) {
		return function() {
			if (i === slimeCount - 1) {
				slimeReady = true; // 确保最后一张加载完毕后设置 ready 状态
			}
		};
	})(i);
	slimeImage.src = "images/slime moving_" + (i) + ".png"; // 假设图片命名为 animated_monster1.png, animated_monster2.png, etc.
	slimeFrames.push(slimeImage);
}
//史莱姆死亡图像
var slimeDeathReady = false;
var slimeDeathFrames = [];
var slimeDeathCount = 11; // 总帧数

for (var i = 0; i < slimeDeathCount; i++) {
    var slimeDeathImage = new Image();
    slimeDeathImage.onload = function () {
        if (i === slimeDeathCount - 1) {
            slimeDeathReady = true;
        }
    };
    slimeDeathImage.src = "images/slime death animation_" + i + ".png"; // 假设图片命名为 slime_death_0.png, slime_death_1.png, etc.
    slimeDeathFrames.push(slimeDeathImage);
}

// 游戏对象
var hero = {
	speed: 256 // 每秒移动的像素数
};
var monster = {
	speed: 100, // 怪物的移动速度
	directionX: 1, // 怪物在X轴的移动方向
	directionY: 1  // 怪物在Y轴的移动方向
};
var slime = {
	x: 100, // 初始X位置
	y: 100, // 初始Y位置
	speed: 80, // 动画怪物的移动速度
	directionX: 1, // 动画怪物在X轴的移动方向
	directionY: 1,  // 动画怪物在Y轴的移动方向
	frameIndex: 0, // 当前帧索引
	frameTimer: 0, // 帧计时器
	frameInterval: 100 // 每帧显示时间（毫秒）
};

var monstersCaught = 0;
var bullets = []; // 子弹数组
var monsters = []; // 用于存储所有怪物的数组
var maxMonsters = 50; // 怪物数量上限
var slimes = []; // 用于存储所有怪物的数组
var maxslime = 50; // 怪物数量上限
var bulletSpeed = 300;
var bulletWidth=10;
var bgMusic = new Audio('sounds/gamemusic.mp3');
bgMusic.loop = true;  // 使背景音乐循环播放
bgMusic.volume = 0.5; // 设置背景音乐音量

// 等待用户交互后播放音乐
document.addEventListener('click', function() {
    bgMusic.play().catch(error => {
        console.log('Background music playback was blocked.');
    });
}, { once: true });  // 仅在第一次点击时触发
//史莱姆死亡音效
var slimeDeathSound = new Audio('sounds/breeze-of-blood.mp3');
slimeDeathSound.volume = 1.0; // 设置音效音量
function playSlimeDeathSound() {
    slimeDeathSound.play();
}
//怪物死亡音效
var monsterDeathSound = new Audio('sounds/big-punch.mp3');
monsterDeathSound.volume = 1.0; // 设置音效音量
function playmonsterDeathSound() {
    monsterDeathSound.play();
}
//升级音效
var levelup = new Audio('sounds/new-level.mp3');
levelup.volume = 1.0; // 设置音效音量
function levelupSound() {
    levelup.play();
}
var keysDown = {};
addEventListener("keydown", function (e) {
    keysDown[e.key.toLowerCase()] = true;  // 使用 `e.key.toLowerCase()` 获取按键字符并转为小写
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.key.toLowerCase()];  // 删除记录的按键状态
}, false);
// 发射子弹函数
var bulletCount = 1;
var fireBullet = function() {
	for (var i = 0; i < bulletCount; i++) {
        var bullet = {
            x: hero.x +i*3+ 16, // 子弹从英雄的位置发射
            y: hero.y +i*3+ 16, // 子弹的初始位置在英雄的中心
            speed: bulletSpeed, // 子弹速度
			directionX: 0,
			directionY: -1
        };
		if (i ==1) { // 额外的子弹朝向左上角
			bullet.directionX = -1;
			bullet.directionY = -1;
		}
		else if (i==2){
			bullet.directionX = 1;
			bullet.directionY = -1;
		}
        bullets.push(bullet);
    }
};
//弹出窗口
var lastChoiceScore = 0; // 记录上一次弹出选择窗口的分数
var showChoiceDialog = function() {
	pauseGame();  // 弹窗前暂停游戏
    resetKeyState();  // 重置按键状态
	levelupSound();
	var choice = prompt("You get 20！Please chose one!:\n1. bullet fast\n2. bullet strong \n3. bullet more", "1");
	choice = parseInt(choice);
	if (choice >= 1 && choice <= 3) {
		handleChoice(choice);
	} else {
		alert("无效选择，默认选择1.");
		handleChoice(1); // 默认选择子弹变快
	}
	lastChoiceScore = monstersCaught; // 更新下一个弹出窗口的分数节点
	resumeGame();  // 关闭弹窗后恢复游戏
};
var bulletInterval = 500;
var handleChoice = function(choice) {
	
	switch(choice) {
		case 1: // 子弹变快
		bulletSpeed += 30;
		bulletInterval-=50;
			break;
		case 2: // 子弹变粗
			bulletWidth *= 2;
			break;
		case 3: // 子弹变多
			bulletCount++;
			break;
	}
	alert("选择已记录！游戏继续！");
};
var checkScoreAndUpdate = function() {
	if (monstersCaught % 10 === 0 && monstersCaught !== lastChoiceScore) { // 检查是否是2的倍数且与上次不同
		showChoiceDialog();
	}
};
setInterval(fireBullet, bulletInterval);
hero.x = canvas.width / 2;
hero.y = canvas.height / 2;
// 重置游戏，当玩家抓到怪物时重新设置
var reset = function () {
	// 随机放置怪物的位置
	monster.x = 32 + (Math.random() * (canvas.width - 64));
	monster.y = 32 + (Math.random() * (canvas.height - 64));
};
// 随机改变怪物方向的计时器
var changeDirectionInterval = Math.random() * 2000 + 1000; // 每1到3秒改变一次方向
var timeSinceLastChange = 0;
//怪物生成循环
function createMonster() {
    if (monsters.length < maxMonsters) { // 检查是否超过上限
        var newMonster = {
            x: 32 + (Math.random() * (canvas.width - 64)), // 随机X位置
            y: 32 + (Math.random() * (canvas.height - 64)), // 随机Y位置
            speed: 100, // 怪物的移动速度
            directionX: (Math.random() > 0.5 ? 1 : -1), // 随机方向
            directionY: (Math.random() > 0.5 ? 1 : -1), // 随机方向
			
        };
        monsters.push(newMonster);
    }
}
setInterval(createMonster, 3000); // 每3秒生成一个怪物
//史莱姆循环生成
function createslime() {
    if (slimes.length < maxslime) {
        var newSlime = {
            x: 32 + (Math.random() * (canvas.width - 64)), // 随机X位置
            y: 32 + (Math.random() * (canvas.height - 64)), // 随机Y位置
            speed: 80, // 史莱姆的移动速度
            directionX: (Math.random() > 0.5 ? 1 : -1), // 随机方向
            directionY: (Math.random() > 0.5 ? 1 : -1), // 随机方向
            frameIndex: 0,
            frameTimer: 0,
            frameInterval: 100,
            isDying: false, // 是否正在播放死亡动画
            deathFrameIndex: 0, // 当前死亡动画帧
            deathFrameTimer: 0, // 死亡动画计时器
            deathFrameInterval: 100 // 死亡动画每帧显示时间（毫秒）
        };
        slimes.push(newSlime);
    }
}

setInterval(createslime, 3000); // 每3秒生成一个怪物

// 更新游戏对象
var update = function (modifier) {
	if (isPaused) return;
	timeSinceLastChange += modifier * 1000;
	// 更新英雄的位置
	if (keysDown['w']) { // 玩家按住 W 键
        hero.y -= hero.speed * modifier;
    }
    if (keysDown['s']) { // 玩家按住 S 键
        hero.y += hero.speed * modifier;
    }
    if (keysDown['a']) { // 玩家按住 A 键
        hero.x -= hero.speed * modifier;
    }
    if (keysDown['d']) { // 玩家按住 D 键
        hero.x += hero.speed * modifier;
    }
	// 不断生成怪物
	for (var i = 0; i < monsters.length; i++) {
		var monster = monsters[i];
		if (timeSinceLastChange >= changeDirectionInterval) {
			monster.directionX = (Math.random() > 0.5 ? 1 : -1);
			monster.directionY = (Math.random() > 0.5 ? 1 : -1);
	
			// 重置计时器
			timeSinceLastChange = 0;
			changeDirectionInterval = Math.random() * 2000 + 1000;
		}
	
	monster.x += monster.directionX * monster.speed * modifier;
	monster.y += monster.directionY * monster.speed * modifier;
	// 检查怪物是否碰到边界，如果是，则改变方向
	if (monster.x <= 0 || monster.x >= canvas.width - 32) {
		monster.directionX *= -1; // 反转X轴方向
	}

	if (monster.y <= 0 || monster.y >= canvas.height - 32) {
		monster.directionY *= -1; // 反转Y轴方向
	}
	// 检查英雄和怪物的碰撞
	}
	//不断生成史莱姆
	for (var i = 0; i < slimes.length; i++) {
		var slime = slimes[i];
		if (slime.isDying) {
			// 播放死亡动画
			slime.deathFrameTimer += modifier * 1000;
			if (slime.deathFrameTimer >= slime.deathFrameInterval) {
				slime.deathFrameTimer = 0;
				slime.deathFrameIndex++;
	
				if (slime.deathFrameIndex >= slimeDeathCount) {
					// 动画播放结束，移除史莱姆
					slimes.splice(i, 1);
					i--;
					continue;
				}
			}
		}
	slime.x += slime.directionX * slime.speed * modifier;
	slime.y += slime.directionY * slime.speed * modifier;
	// 随机改变史莱姆方向
	if (timeSinceLastChange >= changeDirectionInterval) {
		
		slime.directionX = (Math.random() > 0.5 ? 1 : -1);
		slime.directionY = (Math.random() > 0.5 ? 1 : -1);

		// 重置计时器
		timeSinceLastChange = 0;
		changeDirectionInterval = Math.random() * 2000 + 1000;
	}
	
	if (slime.x <= 0 || slime.x >= canvas.width - 32) {
		slime.directionX *= -1; // 反转X轴方向
	}

	if (slime.y <= 0 || slime.y >= canvas.height - 32) {
		slime.directionY *= -1; // 反转Y轴方向
	}

	slime.frameTimer += modifier * 1000;
	if (slime.frameTimer >= slime.frameInterval) {
		slime.frameTimer = 0;
		slime.frameIndex = (slime.frameIndex + 1) % slimeCount;
	}
}
	// 更新子弹的位置
	for (var i = 0; i < bullets.length; i++) {
		var bullet = bullets[i];
		bullet.x += bullet.directionX * bullet.speed * modifier;
	    bullet.y += bullet.directionY * bullet.speed * modifier; // 更新Y轴位置
		if (bullet.y < 0) {
			bullets.splice(i, 1); i--;
		} else {
			for (var j = 0; j < monsters.length; j++) {
				var monster = monsters[j];
				if (
					bullet.x <= (monster.x + 32) &&
					monster.x <= (bullet.x + 16) &&
					bullet.y <= (monster.y + 32) &&
					monster.y <= (bullet.y + 16)
				) {
					++monstersCaught;
					playmonsterDeathSound();
					monsters.splice(j, 1); // 移除击中的怪物
					bullets.splice(i, 1); // 移除子弹
					i--;
					break;
				}
			}
			for (var k = 0; k < slimes.length; k++) {
                var slime = slimes[k];
                if (
                    bullet.x <= (slime.x + 32) &&
                    slime.x <= (bullet.x + 16) &&
                    bullet.y <= (slime.y + 32) &&
                    slime.y <= (bullet.y + 16)
                ) {
					++monstersCaught;
                    slime.isDying = true;
					playSlimeDeathSound();
                    bullets.splice(i, 1); // 移除子弹
                    i--;
                    break;
                }
			}
		}
	}
	checkScoreAndUpdate();
};

// 绘制所有内容
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
	}
    //怪物绘制
	for (var i = 0; i < monsters.length; i++) {
		var monster = monsters[i];
		if (monsterReady) {
			ctx.drawImage(monsterImage, monster.x, monster.y);
		}
	}
	// 史莱姆的当前帧
	for (var i = 0; i < slimes.length; i++) {
		var slime = slimes[i];
		if (slime.isDying) {
			// 绘制死亡动画帧
			ctx.drawImage(slimeDeathFrames[slime.deathFrameIndex], slime.x, slime.y);
		} else {
			// 绘制正常动画帧
			ctx.drawImage(slimeFrames[slime.frameIndex], slime.x, slime.y);
		}
	}
	// 绘制子弹
	ctx.fillStyle = "rgb(255, 0, 0)"; // 子弹颜色为红色
	for (var i = 0; i < bullets.length; i++) {
		var bullet = bullets[i];
		ctx.fillRect(bullet.x, bullet.y, bulletWidth, 20); // 绘制子弹为一个小矩形
	}

	// 绘制分数
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
};

// 游戏主循环
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// 请求再次执行 ASAP
	requestAnimationFrame(main);
};

// 跨浏览器支持 requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// 开始游戏！
var then = Date.now();
reset();
main();