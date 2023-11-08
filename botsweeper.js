function botsweeper(canvas) {
    function load_assets() {
        const cell_up = new Image();
        cell_up.src = "cell_up.png";

        const cell_down = new Image();
        cell_down.src = "cell_down.png";

        const digits = [];
        for (let i = 1; i < 9; ++i) {
            const digit = new Image();
            digit.src = `digit_${i}.png`;
            digits.push(digit);
        }

        const bot = new Image();
        bot.src = "bot.png";

        const flag = new Image();
        flag.src = "flag.png";

        const cursor = new Image();
        cursor.src = "cursor.png";

        return {
            cell_up,
            cell_down,
            digits,
            bot,
            flag,
            cursor,
        };
    }

    const assets = load_assets();

    const width = 20;
    const height = 20;
    const mines = 99;

    canvas.width = width * 24;
    canvas.height = height * 24;
    canvas.tabIndex = 1000;
    canvas.style.outline = "none";

    let cursor_x = 0;
    let cursor_y = 0;
    let opening = false;
    let dead = false;
    let cheat = false;

    let board = build_board(width, height, mines);

    const ctx = canvas.getContext("2d");

    function open() {
        const cell = board[index(width, cursor_x, cursor_y)];

        if (!cell.is_open) {
            cell.is_open = true;

            if (cell.is_mined) {
                dead = true;
            }
        }
    }

    function flag() {
        const cell = board[index(width, cursor_x, cursor_y)];
        if (!cell.is_open) {
            cell.is_flagged = !cell.is_flagged;
        }
    }

    function on_key_down(evt) {
        switch (evt.code) {
            case "KeyC":
                cheat = true;
                break;
            case "KeyR":
                board = build_board(width, height, mines);
                dead = false;
                cursor_x = 0;
                cursor_y = 0;
                break;
        }
        if (dead) {
            return;
        }
        switch (evt.code) {
            case "ArrowDown":
                cursor_y = Math.min(height - 1, cursor_y + 1);
                break;
            case "ArrowUp":
                cursor_y = Math.max(0, cursor_y - 1);
                break;
            case "ArrowLeft":
                cursor_x = Math.max(0, cursor_x - 1);
                break;
            case "ArrowRight":
                cursor_x = Math.min(width - 1, cursor_x + 1);
                break;
            case "Space":
                opening = true;
                break;
            case "KeyF":
                flag();
                break;
        }
    }

    function on_key_up(evt) {
        switch (evt.code) {
            case "KeyC":
                cheat = false;
                break;
        }
        if (dead) {
            return;
        }
        switch (evt.code) {
            case "Space":
                opening = false;
                open();
                break;
        }
    }

    canvas.addEventListener("keydown", on_key_down, true);
    canvas.addEventListener("keyup", on_key_up, true);

    function run() {
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const px_x = x * 24;
                const px_y = y * 24;

                function draw(image) {
                    ctx.drawImage(image, px_x, px_y);
                }

                const cell = board[index(width, x, y)];

                if (cell.is_open || cheat) {
                    draw(assets.cell_down);

                    if (cell.is_mined) {
                        draw(assets.bot);
                    } else if (cell.neighboring_mines > 0) {
                        draw(assets.digits[cell.neighboring_mines - 1]);
                    }
                } else if (cursor_x === x && cursor_y === y && opening) {
                    draw(assets.cell_down);
                } else {
                    draw(assets.cell_up);
                }

                if (cell.is_flagged) {
                    draw(assets.flag);
                }

                if (!dead && cursor_x === x && cursor_y === y) {
                    draw(assets.cursor);
                }
            }
        }

        requestAnimationFrame(run);
    }

    canvas.focus();
    run();
}

function build_board(width, height, mines) {
    const cells = [];

    let mines_placed = 0;

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const cell = {
                x,
                y,
                is_mined: false,
                is_open: false,
                is_flagged: false,
                neighboring_mines: 0,
            };

            if (mines_placed < mines) {
                mines_placed = mines_placed + 1;
                cell.is_mined = true;
            }

            cells.push(cell);
        }
    }

    shuffle(cells);

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const cell = cells[index(width, x, y)];

            for (let n_y = y - 1; n_y <= y + 1; ++n_y) {
                for (let n_x = x - 1; n_x <= x + 1; ++n_x) {
                    const valid_x = n_x >= 0 && n_x < width;
                    const valid_y = n_y >= 0 && n_y < height;

                    if (x === 1 && y === 1) {
                        console.log("for", x, y, "checking", n_x, n_y, valid_x, valid_y);
                    }

                    if (valid_x && valid_y && !(n_x === x && n_y === y)) {
                        const neighbor = cells[index(width, n_x, n_y)];

                        if (neighbor.is_mined) {
                            if (x === 1 && y === 1) {
                                console.log("mine");
                            }
                            cell.neighboring_mines = cell.neighboring_mines + 1;
                        }
                    }
                }
            }
        }
    }

    return cells;
}

function index(width, x, y) {
    return width * y + x;
}

// Fisher-Yates Shuffle
function shuffle(array) {
    let current_index = array.length;
  
    // While there remain elements to shuffle.
    while (current_index > 0) {
  
      // Pick a remaining element.
      let random_index = Math.floor(Math.random() * current_index);
      current_index--;
  
      // And swap it with the current element.
      [array[current_index], array[random_index]] = [
        array[random_index], array[current_index]];
    }
  
    return array;
}
