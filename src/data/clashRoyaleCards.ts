// Static Clash Royale card database with all cards and their properties
import suspiciousBushImg from '@/assets/cards/suspicious-bush.png';
import spiritEmpressImg from '@/assets/cards/spirit-empress.png';
import bossBanditImg from '@/assets/cards/boss-bandit.png';
import berserkerImg from '@/assets/cards/berserker.png';
import goblinCurseImg from '@/assets/cards/goblin-curse.png';
import furnaceImg from '@/assets/cards/furnace.png';
import goblinMachineImg from '@/assets/cards/goblin-machine.png';
import goblinDemolisherImg from '@/assets/cards/goblin-demolisher.png';
export interface ClashRoyaleCard {
  id: number;
  name: string;
  imageUrl: string;
  elixir: number;
  type: 'troop' | 'spell' | 'building';
}

export const CLASH_ROYALE_CARDS: ClashRoyaleCard[] = [
  // Troops
  { id: 26000000, name: "Knight", imageUrl: "https://api-assets.clashroyale.com/cards/300/jAj1Q5rclXxU9kVImGqSJxa4wEMfEhvwNQ_4jiGUuqg.png", elixir: 3, type: "troop" },
  { id: 26000001, name: "Archers", imageUrl: "https://api-assets.clashroyale.com/cards/300/W84bwlsOKOddOo4_D4hs4lo3SJUHZloe8-BmBhK13pc.png", elixir: 3, type: "troop" },
  { id: 26000002, name: "Goblins", imageUrl: "https://api-assets.clashroyale.com/cards/300/SqFa8CI-yg72JOl5iiW6QmpzZOEv-E7VXY5TUtl6LTY.png", elixir: 2, type: "troop" },
  { id: 26000003, name: "Giant", imageUrl: "https://api-assets.clashroyale.com/cards/300/Axk-DvRyOV5_ktIofhuZFEBBdJmhW0lR0nS7N20xZ28.png", elixir: 5, type: "troop" },
  { id: 26000004, name: "P.E.K.K.A", imageUrl: "https://api-assets.clashroyale.com/cards/300/MlArUKfds1lPUmNcpLvJLyGPsBGlYy9OdWGBTwxqp4E.png", elixir: 7, type: "troop" },
  { id: 26000005, name: "Minions", imageUrl: "https://api-assets.clashroyale.com/cards/300/yHGpoTeYgP-G1ugA5YjSvVaWOr1y4QHDr_lCFKOgxsc.png", elixir: 3, type: "troop" },
  { id: 26000006, name: "Balloon", imageUrl: "https://api-assets.clashroyale.com/cards/300/qBipLhqjF6ZyJcKQ3t1hAMrW7STeZG6VCg7UtIHPY6Q.png", elixir: 5, type: "troop" },
  { id: 26000007, name: "Witch", imageUrl: "https://api-assets.clashroyale.com/cards/300/nJarOjUWyLz4GtFV4FiNcHbYdWBP8KANGfGlpSi7rVY.png", elixir: 5, type: "troop" },
  { id: 26000008, name: "Barbarians", imageUrl: "https://api-assets.clashroyale.com/cards/300/IXJX8Fwu6JL3hD9rY9zUbCnNNkgPkshOBYdH0c4cF_o.png", elixir: 5, type: "troop" },
  { id: 26000009, name: "Golem", imageUrl: "https://api-assets.clashroyale.com/cards/300/F0Dm9J_aSKg3yvwwKc-9LhFO-xJPOqWRNWh3KrFkmRY.png", elixir: 8, type: "troop" },
  { id: 26000010, name: "Skeletons", imageUrl: "https://api-assets.clashroyale.com/cards/300/UOwPZAaYNrJFMdEb8qPEVHaQ_hrqOzrJ8EvdopXJ-ng.png", elixir: 1, type: "troop" },
  { id: 26000011, name: "Valkyrie", imageUrl: "https://api-assets.clashroyale.com/cards/300/kWCt4JQNS9-xw1dVWBw52H-qpkYI9gDNqEf3Hn3-VKM.png", elixir: 4, type: "troop" },
  { id: 26000012, name: "Skeleton Army", imageUrl: "https://api-assets.clashroyale.com/cards/300/R5A1qLFEJPLb5nGXSaRQwm2PKf1KsqKj1-Zb_TqDL8A.png", elixir: 3, type: "troop" },
  { id: 26000013, name: "Bomber", imageUrl: "https://api-assets.clashroyale.com/cards/300/bWpKvZp2aFn-dDewPOYd8KJqBdJWjKWKGHKLBcqaNfs.png", elixir: 2, type: "troop" },
  { id: 26000014, name: "Musketeer", imageUrl: "https://api-assets.clashroyale.com/cards/300/ww6ImCqTlBL5ND9V-vKF63b3C7-1G7GwItZ8j77LGaU.png", elixir: 4, type: "troop" },
  { id: 26000015, name: "Baby Dragon", imageUrl: "https://api-assets.clashroyale.com/cards/300/NqG_uXPJ4_Hm0SavwAtNY0WPUqGJp35Rta_f0BfELQI.png", elixir: 4, type: "troop" },
  { id: 26000016, name: "Prince", imageUrl: "https://api-assets.clashroyale.com/cards/300/i5vQQ8CdG5-RsJM_L2j_GOjHGNNQZ0E3aOtC3e3LBB4.png", elixir: 5, type: "troop" },
  { id: 26000017, name: "Wizard", imageUrl: "https://api-assets.clashroyale.com/cards/300/qJXRm0m-kKhtwxOCPSJ2O45jQPdPWaINhlO58rEBLFA.png", elixir: 5, type: "troop" },
  { id: 26000018, name: "Mini P.E.K.K.A", imageUrl: "https://api-assets.clashroyale.com/cards/300/eP4PU5_S7EuVvgd6-c8ubtNpRJA4tgCX_1bHTLJj8qY.png", elixir: 4, type: "troop" },
  { id: 26000019, name: "Spear Goblins", imageUrl: "https://api-assets.clashroyale.com/cards/300/16lmVJhLUFzOl6vl4Q2N8e3KH8KJ7QBUlyI8z--b-m8.png", elixir: 2, type: "troop" },
  { id: 26000020, name: "Giant Skeleton", imageUrl: "https://api-assets.clashroyale.com/cards/300/Qv-Wad8EqcgJGjdp5lY_Fx34miQ6S2fGdZTUvhF0dwo.png", elixir: 6, type: "troop" },
  { id: 26000021, name: "Hog Rider", imageUrl: "https://api-assets.clashroyale.com/cards/300/Uq7e4eDZvnJvxlKqLb67PYGzKy8Q_m5tQ8v-r4v-WaI.png", elixir: 4, type: "troop" },
  { id: 26000022, name: "Minion Horde", imageUrl: "https://api-assets.clashroyale.com/cards/300/r1y_k_Tm2L4ItXUhQANwSc8L1w1CiI0WkIVa7pM1M6s.png", elixir: 5, type: "troop" },
  { id: 26000023, name: "Ice Wizard", imageUrl: "https://api-assets.clashroyale.com/cards/300/nNeMu0q5tEhfGGTAPfXzl9zI-s-gU7MJJNlN2AhCFCs.png", elixir: 3, type: "troop" },
  { id: 26000024, name: "Royal Giant", imageUrl: "https://api-assets.clashroyale.com/cards/300/bk9VUlkxFYAGLR9qN7U2lJgDm0B7LVHZ-THFgJ9Vf88.png", elixir: 6, type: "troop" },
  { id: 26000025, name: "Guards", imageUrl: "https://api-assets.clashroyale.com/cards/300/FGy5Sn2TJSPnFTbmF6LS3mN9I1vGrElQzNEqXTT_GJw.png", elixir: 3, type: "troop" },
  { id: 26000026, name: "Princess", imageUrl: "https://api-assets.clashroyale.com/cards/300/jVRfS3L0YvzI_QSw3dQ4x0Zg3yKM2hRi9S5WKVLtmks.png", elixir: 3, type: "troop" },
  { id: 26000027, name: "Dark Prince", imageUrl: "https://api-assets.clashroyale.com/cards/300/xBE3fEKPJm2xO7lS6oPB1rJlKjCe5o8GlFzjxgQQMYE.png", elixir: 4, type: "troop" },
  { id: 26000028, name: "Three Musketeers", imageUrl: "https://api-assets.clashroyale.com/cards/300/rSM7OzVQ1PxgKtPvEkmOINLqN-hbw3m3CfUx_NP3pNw.png", elixir: 9, type: "troop" },
  { id: 26000029, name: "Lava Hound", imageUrl: "https://api-assets.clashroyale.com/cards/300/P6l2w1h9VR5Rm8w4v0K3iMgZGwH-0Ib8K4s7bCnRvko.png", elixir: 7, type: "troop" },
  { id: 26000030, name: "Ice Spirit", imageUrl: "https://api-assets.clashroyale.com/cards/300/F3z9Y3xH_1T8Cjzb5b5HZ4n8TY1CiXaQlh-2F6FI9so.png", elixir: 1, type: "troop" },
  { id: 26000031, name: "Fire Spirit", imageUrl: "https://api-assets.clashroyale.com/cards/300/XWp9gdHNwTNlTpIgDe7t6j7FPLo1-uJ8cJo4YmGl-rE.png", elixir: 1, type: "troop" },
  { id: 26000032, name: "Miner", imageUrl: "https://api-assets.clashroyale.com/cards/300/I5GS_Nq8s8vr8nCJYJ3Tq7zBxZRb-wV0S3gLKOJD7Jk.png", elixir: 3, type: "troop" },
  { id: 26000033, name: "Sparky", imageUrl: "https://api-assets.clashroyale.com/cards/300/A-QQeqMEQ4a-iFRhYR9QEe4sEL1F_lOLI6cgNKKN4Zg.png", elixir: 6, type: "troop" },
  { id: 26000034, name: "Bowler", imageUrl: "https://api-assets.clashroyale.com/cards/300/jJXdMQCBc7v0K6vdklNwqrYxdW9MK4qjRWW5P9KN6z8.png", elixir: 5, type: "troop" },
  { id: 26000035, name: "Lumberjack", imageUrl: "https://api-assets.clashroyale.com/cards/300/L3GEjYJMgF8q3K-ywYxe1zw2-B5TjZ5HG_pGfY6nZPw.png", elixir: 4, type: "troop" },
  { id: 26000036, name: "Battle Ram", imageUrl: "https://api-assets.clashroyale.com/cards/300/F6z8eEwfSJ2HUgxD9l5HIR2v1mJ6YjO8VqF-i5Dn2uY.png", elixir: 4, type: "troop" },
  { id: 26000037, name: "Inferno Dragon", imageUrl: "https://api-assets.clashroyale.com/cards/300/UWCOQOtTq_p31_I5kLQi6Mj8b5HYBqZp7GCnFf40Z9A.png", elixir: 4, type: "troop" },
  { id: 26000038, name: "Ice Golem", imageUrl: "https://api-assets.clashroyale.com/cards/300/grJj_mTm7g2QZ0j2VGDqE8ZdP0z2Bv1qA2Hf1TkBLH4.png", elixir: 2, type: "troop" },
  { id: 26000039, name: "Mega Minion", imageUrl: "https://api-assets.clashroyale.com/cards/300/4LKXJ9I7qHdtXZrv2VpNrHk0gf_PD2C1e5z-0CiN8Nw.png", elixir: 3, type: "troop" },
  { id: 26000040, name: "Dart Goblin", imageUrl: "https://api-assets.clashroyale.com/cards/300/oa1iFVyLmxPZ5g5kqcOAYvT-qgT3gON_uLJTYjdRdNo.png", elixir: 3, type: "troop" },
  { id: 26000041, name: "Goblin Gang", imageUrl: "https://api-assets.clashroyale.com/cards/300/VkOlj3vJuEH3K3-7hhKq1dK30xc7qHJDmv6ckqV0Bz8.png", elixir: 3, type: "troop" },
  { id: 26000042, name: "Electro Wizard", imageUrl: "https://api-assets.clashroyale.com/cards/300/D7Ey7CbBgdl8A5f3N2O3qfpgGpZFOIJpLeFtO5aXW2g.png", elixir: 4, type: "troop" },
  { id: 26000043, name: "Elite Barbarians", imageUrl: "https://api-assets.clashroyale.com/cards/300/6TyJN9HFD0yZZ-qtOzAQRZS3KJFLGxLj8qiY8R7_FRo.png", elixir: 6, type: "troop" },
  { id: 26000044, name: "Hunter", imageUrl: "https://api-assets.clashroyale.com/cards/300/bJ6QfJNrFj6z2Kh3fB4zUGjKhpvGdLXjgOt2dLz4O9w.png", elixir: 4, type: "troop" },
  { id: 26000045, name: "Executioner", imageUrl: "https://api-assets.clashroyale.com/cards/300/QV8u7-Fv9CtMUa88E9Pr7YCX_LbEfWgeLgFSqNOlQ3s.png", elixir: 5, type: "troop" },
  { id: 26000046, name: "Bandit", imageUrl: "https://api-assets.clashroyale.com/cards/300/PBB1Y3kUyJQQgK7VCZyL_SdlDkJ2KvThVnHa7dV6Q2g.png", elixir: 3, type: "troop" },
  { id: 26000047, name: "Royal Recruits", imageUrl: "https://api-assets.clashroyale.com/cards/300/SGcz9zFwpKFhJiKVX6kJ_H-WR5KlKYiF5T6wz3Kz5rI.png", elixir: 7, type: "troop" },
  { id: 26000048, name: "Night Witch", imageUrl: "https://api-assets.clashroyale.com/cards/300/kJjgN-R8U7j3SJ8nKw7b9wLJtNhOq1yF1SJj2SoKmpo.png", elixir: 4, type: "troop" },
  { id: 26000049, name: "Bats", imageUrl: "https://api-assets.clashroyale.com/cards/300/wH5UQ6xjYWJPpZdYzN_IfY7X0vqYo0VsX6lD9LL_HlY.png", elixir: 2, type: "troop" },
  { id: 26000050, name: "Ghost", imageUrl: "https://api-assets.clashroyale.com/cards/300/rTELTp4p1-3KLMH1vb4bKSO7QQgFVA4k9fVKH1SBT3Y.png", elixir: 3, type: "troop" },
  { id: 26000051, name: "Royal Ghost", imageUrl: "https://api-assets.clashroyale.com/cards/300/k-P6nSHYVqKI1HU6YTqGXJQXX5F9RMEjZEXzS6-1KlY.png", elixir: 3, type: "troop" },
  { id: 26000052, name: "Ram Rider", imageUrl: "https://api-assets.clashroyale.com/cards/300/Suz4F7lW8JmpJJBmHjhzw6r4pKYdlCg4xfR9EaMhwck.png", elixir: 5, type: "troop" },
  { id: 26000053, name: "Zappies", imageUrl: "https://api-assets.clashroyale.com/cards/300/wz-PIcpNQT2LwdT5IUvKqH2XfZ5vgKQJ7fXHLvWL5rM.png", elixir: 4, type: "troop" },
  { id: 26000054, name: "Rascals", imageUrl: "https://api-assets.clashroyale.com/cards/300/8JdLXzP5cMp0CfUAJ3_HvKMDUILLzqUgU_QkVGc9rXM.png", elixir: 5, type: "troop" },
  { id: 26000055, name: "Cannon Cart", imageUrl: "https://api-assets.clashroyale.com/cards/300/9Ck6bJDPSU3Xf8H6p_jzF-CdDqH4vk8bTfT4fHoOmQo.png", elixir: 5, type: "troop" },
  { id: 26000056, name: "Mega Knight", imageUrl: "https://api-assets.clashroyale.com/cards/300/IgXOQFRU4sEt8Tx9lOjP_yHrxZFg2G9VQI3TL6F_wLo.png", elixir: 7, type: "troop" },
  { id: 26000057, name: "Skeleton Barrel", imageUrl: "https://api-assets.clashroyale.com/cards/300/yKXP6S5GlL_LK2K8fy3KqJNWM3gfYU4zFZKNSKuVFog.png", elixir: 3, type: "troop" },
  { id: 26000058, name: "Flying Machine", imageUrl: "https://api-assets.clashroyale.com/cards/300/7FHb3LKvBJxgUwPLfm3CRgZMI5tGV3VE5HvlOzM7C9Q.png", elixir: 4, type: "troop" },
  { id: 26000059, name: "Wall Breakers", imageUrl: "https://api-assets.clashroyale.com/cards/300/kSJdJy7JFZp8N8oV5gRfK5z1AK2mPwgZW3LKyYqWL8o.png", elixir: 2, type: "troop" },
  { id: 26000060, name: "Royal Hogs", imageUrl: "https://api-assets.clashroyale.com/cards/300/MO79Z_pf1I7KwGcHPMr2x3z2p6TGK9MhKt9fzNKaGRY.png", elixir: 5, type: "troop" },
  { id: 26000061, name: "Goblin Giant", imageUrl: "https://api-assets.clashroyale.com/cards/300/8TK7qLHXf7D4YJKpzP6oG4SBLj3T9wXjc2CJOCo2NTg.png", elixir: 6, type: "troop" },
  { id: 26000062, name: "Fisherman", imageUrl: "https://api-assets.clashroyale.com/cards/300/yWwHYWA2QKQ6UcLKQW7Y_ZwXNUz7vbkWQ2LDEQEOJeo.png", elixir: 3, type: "troop" },
  { id: 26000063, name: "Magic Archer", imageUrl: "https://api-assets.clashroyale.com/cards/300/VbMRVPJrYwXu1eR7NJh2IKhgdF9sC4n1CJK3ZNZl0sg.png", elixir: 4, type: "troop" },
  { id: 26000064, name: "Electro Dragon", imageUrl: "https://api-assets.clashroyale.com/cards/300/9m9qvgtA9BBFE5IKkJ5oV4xYCM2ykv4o3qQEyGVDMOA.png", elixir: 5, type: "troop" },
  { id: 26000065, name: "Firecracker", imageUrl: "https://api-assets.clashroyale.com/cards/300/zFDSPfF8S8HYP0GXYC1oALGJa0o4MjNP7vgR4R7GZUA.png", elixir: 3, type: "troop" },
  { id: 26000066, name: "Mighty Miner", imageUrl: "https://api-assets.clashroyale.com/cards/300/hc8Zq4z6wPJznqDX0U8fxmR7-YO6Y9KgB_WnHnwYgkE.png", elixir: 4, type: "troop" },
  { id: 26000067, name: "Elixir Golem", imageUrl: "https://api-assets.clashroyale.com/cards/300/FAbLZdWwGXGfx9m_QkVfPQKHbRFGOj3dZSkXPMJR1gQ.png", elixir: 3, type: "troop" },
  { id: 26000068, name: "Battle Healer", imageUrl: "https://api-assets.clashroyale.com/cards/300/Bf8w3GYGg7Cz4WN7wQQ-LBkNJ7jkA_sXzMdZU-TxO8o.png", elixir: 4, type: "troop" },
  { id: 26000069, name: "Skeleton King", imageUrl: "https://api-assets.clashroyale.com/cards/300/p_7oLwKadWhQ5_x9Qp3AHaJudD8f-2f8kkMrk3QHLK8.png", elixir: 4, type: "troop" },
  { id: 26000070, name: "Archer Queen", imageUrl: "https://api-assets.clashroyale.com/cards/300/I7pOKd0J1pdfmf8h0KUsXCU2Hrl8d-Y7dFyMN_QvK0M.png", elixir: 5, type: "troop" },
  { id: 26000071, name: "Golden Knight", imageUrl: "https://api-assets.clashroyale.com/cards/300/8U-DUOh7S4DcOA-lnWHkz4KTzrBaKHOqTuP4VaQ7Q8Y.png", elixir: 4, type: "troop" },
  { id: 26000072, name: "Monk", imageUrl: "https://api-assets.clashroyale.com/cards/300/m6Xy3T-0_2HQGy_MYVKf0dK96fSJ7mAw9yIb3YtGtF8.png", elixir: 5, type: "troop" },
  { id: 26000073, name: "Skeleton Dragons", imageUrl: "https://api-assets.clashroyale.com/cards/300/z_D6kgU9qlpXlLkCN8q7pf-A8vKHOOXnPQjA3KCKDjY.png", elixir: 4, type: "troop" },
  { id: 26000074, name: "Mother Witch", imageUrl: "https://api-assets.clashroyale.com/cards/300/rCJUGR8y92Gp-LjyYT1p7T8MtP9Zez9Qj_qQK8wjZtk.png", elixir: 4, type: "troop" },
  { id: 26000075, name: "Electro Spirit", imageUrl: "https://api-assets.clashroyale.com/cards/300/2pJ7VBgCkR7sWtpbM8wnAfXE8KS5w4Q5JLDkn8Iq4ow.png", elixir: 1, type: "troop" },
  { id: 26000076, name: "Electro Giant", imageUrl: "https://api-assets.clashroyale.com/cards/300/M_1wWpC5L9j6LFHdqYK4tSNH6S_tqbJ__-Ql3CQONNk.png", elixir: 7, type: "troop" },
  { id: 26000077, name: "Champion", imageUrl: "https://api-assets.clashroyale.com/cards/300/B7hPJo6N8uWXdZrvwNqxfzl1q_VgO0NKNG5DVMQ5sP4.png", elixir: 4, type: "troop" },
  { id: 26000078, name: "Phoenix", imageUrl: "https://api-assets.clashroyale.com/cards/300/8y9OwN8iNHwQxKHdx7kQtZ_nN0TJFM6p9eUJ6j9cKrY.png", elixir: 4, type: "troop" },

  // Spells
  { id: 28000000, name: "Lightning", imageUrl: "https://api-assets.clashroyale.com/cards/300/lhBDtR9Dc6F-dXdrV3N6r8CU7O2jHmcOCnXpSP_yQ6s.png", elixir: 6, type: "spell" },
  { id: 28000001, name: "Fireball", imageUrl: "https://api-assets.clashroyale.com/cards/300/dkOJrWQ8h9HmnGH9NvL9mJGGW1XZyKHOJI3d0Y1Rpo8.png", elixir: 4, type: "spell" },
  { id: 28000002, name: "Arrows", imageUrl: "https://api-assets.clashroyale.com/cards/300/ROdvlmWxJLgf9RTZzq3m_HPAH8A3Vvbf8cgOOJLy8SA.png", elixir: 3, type: "spell" },
  { id: 28000003, name: "Rage", imageUrl: "https://api-assets.clashroyale.com/cards/300/6Ai-YIXmLFBPKs9RZxgNl7yUhqHNNnr1vJJB5QQ-r7c.png", elixir: 2, type: "spell" },
  { id: 28000004, name: "Rocket", imageUrl: "https://api-assets.clashroyale.com/cards/300/eYFbN4q2AQiGFxe5m3QGxVhb3Pb8mGrXU1XeQG6Ny7c.png", elixir: 6, type: "spell" },
  { id: 28000005, name: "Goblin Barrel", imageUrl: "https://api-assets.clashroyale.com/cards/300/8qAkcGfQ_YP8kX5T_8JKW2QF9FJQR3YOdNJU5YQZF7A.png", elixir: 3, type: "spell" },
  { id: 28000006, name: "Freeze", imageUrl: "https://api-assets.clashroyale.com/cards/300/3vuvYjE2-u2w-qlzLqWD1h8Ej7vR_VzqpQHRBQ8QQ5c.png", elixir: 4, type: "spell" },
  { id: 28000007, name: "Mirror", imageUrl: "https://api-assets.clashroyale.com/cards/300/Q2U2S2rL5F_-9X9aLQH0KX_-pePQYvNu8QH5pOGOa6g.png", elixir: 1, type: "spell" },
  { id: 28000008, name: "Log", imageUrl: "https://api-assets.clashroyale.com/cards/300/LnNvOPvyXKU0rJ7gV_MqUBcBZtBvFDU_fTzHNgZaX6A.png", elixir: 2, type: "spell" },
  { id: 28000009, name: "Tornado", imageUrl: "https://api-assets.clashroyale.com/cards/300/7v-VXJJRH_F1PpZjVGzGKWjnNY8WgDLnVMXhfPKRqE8.png", elixir: 3, type: "spell" },
  { id: 28000010, name: "Clone", imageUrl: "https://api-assets.clashroyale.com/cards/300/8BDDCqH8BFY8vL-SZvHy0Mq0OJgDU7mSJ8m9qOVQ1zo.png", elixir: 3, type: "spell" },
  { id: 28000011, name: "Earthquake", imageUrl: "https://api-assets.clashroyale.com/cards/300/-PN5dJ5pvk8X-lPJnH5VGeLNp2E4rIRTF-1JKlDqN5c.png", elixir: 3, type: "spell" },
  { id: 28000012, name: "Barbarian Barrel", imageUrl: "https://api-assets.clashroyale.com/cards/300/yqQpGmHgk5JpI5S3dMUceFDOKCTKQs5xUdJhELPqJPQ.png", elixir: 2, type: "spell" },
  { id: 28000013, name: "Heal Spirit", imageUrl: "https://api-assets.clashroyale.com/cards/300/3WqYhj3ijR-wTv_uJXLhLGFvL8XAzY3E3FGK8QQ3T8Y.png", elixir: 1, type: "spell" },
  { id: 28000014, name: "Giant Snowball", imageUrl: "https://api-assets.clashroyale.com/cards/300/bR5E6g-tBSQwG9XzSKIrBn_S_fQ7mQ4XD-LgMdTQ_xY.png", elixir: 2, type: "spell" },
  { id: 28000015, name: "Royal Delivery", imageUrl: "https://api-assets.clashroyale.com/cards/300/Lz6KFYgHwT-6QZ8w1WIU4s5P1ZQJvK1EL6qQP6oX6gQ.png", elixir: 3, type: "spell" },
  { id: 28000016, name: "Graveyard", imageUrl: "https://api-assets.clashroyale.com/cards/300/F0VGD6gQJV8Xc5NJw9zGwE_6TvMgZMH7qA3SFXTwEGg.png", elixir: 5, type: "spell" },
  { id: 28000017, name: "Poison", imageUrl: "https://api-assets.clashroyale.com/cards/300/NVdKmBBN8TkEHC4yK3NNh4h_oJQGn-nL2sRCw3D4Jmc.png", elixir: 4, type: "spell" },
  { id: 28000018, name: "Zap", imageUrl: "https://api-assets.clashroyale.com/cards/300/VUmdQIGaQ3QD1VB9Y5mNRDYsRzCe3gV2vLYTXsAfqFI.png", elixir: 2, type: "spell" },

  // Buildings
  { id: 27000000, name: "Cannon", imageUrl: "https://api-assets.clashroyale.com/cards/300/8k3UwE5Z8L8X4GW9hLq9aN7RO5oE9QH9JaEzXlVQpzE.png", elixir: 3, type: "building" },
  { id: 27000001, name: "Goblin Hut", imageUrl: "https://api-assets.clashroyale.com/cards/300/CsOCa_OQc6uDpZfhEFR8Dg1JUgQGxAv6fKhOZz7YCEk.png", elixir: 5, type: "building" },
  { id: 27000002, name: "Mortar", imageUrl: "https://api-assets.clashroyale.com/cards/300/BotmGf_kYIq5-YIlBMXEQOZNdxQVQ4F8eMWOzQ8F-xg.png", elixir: 4, type: "building" },
  { id: 27000003, name: "Inferno Tower", imageUrl: "https://api-assets.clashroyale.com/cards/300/FqHI7TEaFEPKnSzPxRp6UZZKb2sHfqYX6jyFQwCZJE0.png", elixir: 5, type: "building" },
  { id: 27000004, name: "Bomb Tower", imageUrl: "https://api-assets.clashroyale.com/cards/300/WGC0stlzuL8Ue7jVqHK_qQq5gQ0nN_W-j7Kqf_qYmBo.png", elixir: 4, type: "building" },
  { id: 27000005, name: "Barbarian Hut", imageUrl: "https://api-assets.clashroyale.com/cards/300/FY0YfKbYFOMXz5Q7Kt2N1s-bh2Q_5qQ2EzW7n5Fp_Tk.png", elixir: 7, type: "building" },
  { id: 27000006, name: "Tesla", imageUrl: "https://api-assets.clashroyale.com/cards/300/H3z7Jmd1q7wY7DjKcpKJ6nQ1QqUxMvK4I3EvQ3kRBB4.png", elixir: 4, type: "building" },
  { id: 27000007, name: "Elixir Collector", imageUrl: "https://api-assets.clashroyale.com/cards/300/h_F-1G6YD5LZhQ5M-wE0yF-FJF6E9lN6N8X8TU-QEGc.png", elixir: 6, type: "building" },
  { id: 27000008, name: "X-Bow", imageUrl: "https://api-assets.clashroyale.com/cards/300/zTKOjILNJPMxVn2r4Dj6lY2YH0QHqN9Z8f_8xVvLKcA.png", elixir: 6, type: "building" },
  { id: 27000009, name: "Tombstone", imageUrl: "https://api-assets.clashroyale.com/cards/300/G1iVIKJMBiJd-c5HceMOTzJO4t-VYzUk5u_K8NYOvf8.png", elixir: 3, type: "building" },
  { id: 27000010, name: "Furnace", imageUrl: furnaceImg, elixir: 4, type: "troop" },
  { id: 27000011, name: "Goblin Cage", imageUrl: "https://api-assets.clashroyale.com/cards/300/S_HAg1nGH2m0vQ7IVQsS8FRbhvN4OKWkXG6t6YGgY-E.png", elixir: 4, type: "building" },
  { id: 27000012, name: "Goblin Drill", imageUrl: "https://api-assets.clashroyale.com/cards/300/Dqt3g5_KqGrW8_2_KQ5BQ9-6KkJ8MZ_ZN_8-QqF0qF4.png", elixir: 4, type: "building" },

// Newer cards (overrides)
// Ensure Goblin Machine (26000096) is recognized locally; include working image and elixir
{ id: 26000093, name: "Little Prince", imageUrl: "https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/little-prince.png", elixir: 4, type: "troop" },
{ id: 26000095, name: "Goblin Demolisher", imageUrl: goblinDemolisherImg, elixir: 4, type: "troop" },
{ id: 26000096, name: "Goblin Machine", imageUrl: goblinMachineImg, elixir: 5, type: "troop" },
{ id: 26000097, name: "Suspicious Bush", imageUrl: suspiciousBushImg, elixir: 2, type: "troop" },
{ id: 26000102, name: "Berserker", imageUrl: berserkerImg, elixir: 2, type: "troop" },
{ id: 26000103, name: "Boss Bandit", imageUrl: bossBanditImg, elixir: 6, type: "troop" },
{ id: 28000024, name: "Goblin Curse", imageUrl: goblinCurseImg, elixir: 2, type: "spell" },
{ id: 28000025, name: "Spirit Empress", imageUrl: spiritEmpressImg, elixir: 6, type: "troop" },
];

// Remote augmentation: fetch full cards catalog once and merge as fallback
const REMOTE_CARDS: Map<number, ClashRoyaleCard> = new Map();
let remoteInitStarted = false;

function initRemoteOnce() {
  if (remoteInitStarted) return;
  remoteInitStarted = true;
  (async () => {
    try {
      const res = await fetch('https://royaleapi.github.io/cr-api-data/json/cards.json');
      const data = await res.json();
      for (const entry of data) {
        const typeLower = String(entry.type || '').toLowerCase();
        const type: 'troop' | 'spell' | 'building' =
          (typeLower === 'troop' || typeLower === 'spell' || typeLower === 'building')
            ? (typeLower as any)
            : 'troop';
        const keySanitized = String(entry.key || '').toLowerCase().replace(/_/g, '-');
        let imageUrl = `https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/${keySanitized}.png`;
if (keySanitized === 'goblin-machine') {
          imageUrl = goblinMachineImg as string;
        } else if (keySanitized === 'goblin-demolisher') {
          imageUrl = goblinDemolisherImg as string;
        }
        REMOTE_CARDS.set(Number(entry.id), {
          id: Number(entry.id),
          name: String(entry.name || entry.key || `Card ${entry.id}`),
          imageUrl,
          elixir: Number(entry.elixir ?? 0),
          type,
        });
      }
    } catch (e) {
      console.warn('clashRoyaleCards: failed to prefetch remote catalog', e);
    }
  })();
}

// Helper function to get card by ID (local first, then remote fallback)
export function getCardById(id: number): ClashRoyaleCard | undefined {
  initRemoteOnce();
  return CLASH_ROYALE_CARDS.find(card => card.id === id) ?? REMOTE_CARDS.get(id);
}

// Helper function to get multiple cards by IDs
export function getCardsByIds(ids: number[]): ClashRoyaleCard[] {
  initRemoteOnce();
  return ids.map(id => getCardById(id)).filter(Boolean) as ClashRoyaleCard[];
}